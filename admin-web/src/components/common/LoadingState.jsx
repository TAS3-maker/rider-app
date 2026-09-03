const LoadingState = ({ message = "Loading..." }) => {
  return <div className="w-full py-16 flex flex-col items-center justify-center text-center">
      <div
    className="w-8 h-8 border-3 border-[#3AAFA9]/30 border-t-[#3AAFA9] rounded-full animate-spin mb-3"
    role="status"
    aria-label="Loading"
  />
      <p className="text-[13px] text-[#8A8A9A] font-medium">{message}</p>
    </div>;
};
export {
  LoadingState
};
