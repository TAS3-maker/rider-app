import { useNavigate } from "react-router-dom";
const NotFoundPage = () => {
  const navigate = useNavigate();
  return <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="text-[48px] font-black text-[#3AAFA9] mb-2">404</div>
      <h2 className="text-[20px] font-bold text-[#1A1A2E] mb-2">Screen Not Found</h2>
      <p className="text-[14px] text-[#8A8A9A] max-w-md mb-6">
        The requested admin screen does not exist or has been relocated.
      </p>
      <button
    type="button"
    onClick={() => navigate("/dashboard")}
    className="px-5 py-2.5 bg-[#3AAFA9] text-white text-[13px] font-semibold rounded-[8px] hover:bg-[#2B8A85] transition-colors"
  >
        Return to Dashboard
      </button>
    </div>;
};
export {
  NotFoundPage
};
