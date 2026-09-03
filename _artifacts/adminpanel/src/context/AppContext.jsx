import { createContext, useContext, useState, useCallback } from "react";
const AppContext = createContext(void 0);
const AppProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [isWireframeFrameMode, setIsWireframeFrameMode] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const addToast = useCallback((message, type = "success") => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4e3);
  }, [removeToast]);
  const toggleWireframeFrameMode = useCallback(() => {
    setIsWireframeFrameMode((prev) => !prev);
  }, []);
  const toggleAnnotations = useCallback(() => {
    setShowAnnotations((prev) => !prev);
  }, []);
  const triggerRefresh = useCallback(() => {
    setRefreshKey(Date.now());
  }, []);
  return <AppContext.Provider
    value={{
      toasts,
      addToast,
      removeToast,
      isWireframeFrameMode,
      toggleWireframeFrameMode,
      showAnnotations,
      toggleAnnotations,
      refreshKey,
      triggerRefresh
    }}
  >
      {children}
    </AppContext.Provider>;
};
const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
export {
  AppProvider,
  useApp
};
