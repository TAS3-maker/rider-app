import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
const AuthContext = createContext(void 0);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener("ridepact_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("ridepact_unauthorized", handleUnauthorized);
  }, []);
  const login = async (email, pass, role = "super_admin") => {
    const loggedUser = await authService.login(email, pass, role);
    setUser(loggedUser);
  };
  const logout = async () => {
    await authService.logout();
    setUser(null);
  };
  return <AuthContext.Provider
    value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout
    }}
  >
      {children}
    </AuthContext.Provider>;
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export {
  AuthProvider,
  useAuth
};
