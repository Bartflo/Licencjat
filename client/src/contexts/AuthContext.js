import React, { createContext, useState, useContext } from "react";
import {
  getJwtToken,
  setJwtToken,
  removeJwtToken,
} from "../components/auth/utils";
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    getJwtToken() ? true : false
  );

  const login = (token) => {
    setJwtToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    removeJwtToken();
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
