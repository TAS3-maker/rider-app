"""
RidePact edge proxy.

The platform's supervisor launches `uvicorn server:app` on 0.0.0.0:8001 and this
file cannot change that command. The real application backend is Node.js +
Express + Mongoose (see /app/backend/src), run as a separate supervisor program
on 127.0.0.1:8500. This thin ASGI app transparently reverse-proxies every HTTP
request and WebSocket connection from :8001 to the Node backend, so from the
outside there is a single backend on :8001 exactly as required.
"""
import httpx
import websockets
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from starlette.background import BackgroundTask

NODE_TARGET = "http://127.0.0.1:8500"
NODE_WS_TARGET = "ws://127.0.0.1:8500"

# Hop-by-hop headers that must not be forwarded.
HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "host", "content-length",
}

app = FastAPI(title="RidePact edge proxy")
_client: httpx.AsyncClient | None = None


@app.on_event("startup")
async def _startup():
    global _client
    _client = httpx.AsyncClient(base_url=NODE_TARGET, timeout=httpx.Timeout(60.0))


@app.on_event("shutdown")
async def _shutdown():
    if _client:
        await _client.aclose()


@app.websocket("/socket.io/{path:path}")
async def proxy_socket_io(client_ws: WebSocket, path: str):
    """Proxy Socket.IO / WebSocket upgrades to the Node backend."""
    await client_ws.accept()
    qs = client_ws.url.query
    upstream_url = f"{NODE_WS_TARGET}/socket.io/{path}" + (f"?{qs}" if qs else "")
    try:
        async with websockets.connect(upstream_url) as upstream:
            import asyncio

            async def c2u():
                try:
                    while True:
                        msg = await client_ws.receive_text()
                        await upstream.send(msg)
                except Exception:
                    pass

            async def u2c():
                try:
                    async for msg in upstream:
                        await client_ws.send_text(msg)
                except Exception:
                    pass

            await asyncio.gather(c2u(), u2c())
    except Exception:
        pass
    finally:
        try:
            await client_ws.close()
        except Exception:
            pass


@app.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(request: Request, path: str):
    if _client is None:
        return Response(content='{"error":"proxy not ready"}', status_code=503,
                        media_type="application/json")

    url = "/" + path
    if request.url.query:
        url += "?" + request.url.query

    fwd_headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP_BY_HOP}
    body = await request.body()

    try:
        upstream = await _client.request(
            request.method, url, headers=fwd_headers, content=body,
        )
    except (httpx.ConnectError, httpx.ReadError, httpx.ConnectTimeout):
        return Response(
            content='{"error":"backend starting, please retry"}',
            status_code=502, media_type="application/json",
        )

    resp_headers = {
        k: v for k, v in upstream.headers.items() if k.lower() not in HOP_BY_HOP
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=resp_headers,
        media_type=upstream.headers.get("content-type"),
    )
