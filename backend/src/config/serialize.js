// Strip Mongo internals (_id/__v) and expose a clean `id` for API responses.
function clean(doc) {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return { id: _id, ...rest };
}
function cleanList(docs) {
  return (docs || []).map(clean);
}
module.exports = { clean, cleanList };
