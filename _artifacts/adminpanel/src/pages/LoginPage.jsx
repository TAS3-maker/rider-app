import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
const LoginPage = () => {
  const [email, setEmail] = useState("lakshya@techarchsoftwares.in");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      addToast("Signed in successfully as Administrator", "success");
      navigate(from, { replace: true });
    } catch {
      addToast("Invalid credentials. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[#E8E8E8] overflow-hidden">
        {
    /* Top Header with Brand */
  }
        <div className="bg-[#1A1A2E] p-6 text-center text-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#3AAFA9] text-white text-[20px] font-black mb-3 shadow-md">
            RP
          </div>
          <h1 className="text-[20px] font-bold tracking-tight">RidePact Admin</h1>
          <p className="text-[13px] text-white/70 mt-1">
            Student Ride Coordination Platform
          </p>
        </div>

        {
    /* Login Form */
  }
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1.5">
              Admin Email
            </label>
            <input
    type="email"
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none"
  />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1.5">
              Password
            </label>
            <input
    type="password"
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none"
  />
          </div>

          <button
    type="submit"
    disabled={isLoading}
    className="w-full py-3 bg-[#3AAFA9] hover:bg-[#2B8A85] text-white text-[14px] font-bold rounded-[8px] transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
  >
            {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <span>Sign In to Admin Panel</span>
          </button>

          <div className="p-3 bg-[#FAFAFA] rounded-[8px] border border-[#E8E8E8] text-[12px] text-[#8A8A9A] text-center">
            Demo login pre-filled with super admin credentials. Click sign in to enter.
          </div>
        </form>
      </div>
    </div>;
};
export {
  LoginPage
};
