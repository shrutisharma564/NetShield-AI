import React, { createContext, useContext, useEffect, useState } from "react";
import { getMe, login as loginApi, logoutApi } from "../services/api";

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data);
    } catch {
      setUser(null);
      localStorage.removeItem("netshield_token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("netshield_token");
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginApi(email, password);
    localStorage.setItem("netshield_token", res.data.access_token);
    await fetchUser();
  };

  const logout = () => {
    // Best-effort audit log; we clear local state regardless of the result
    // since JWTs are stateless and the token becomes useless once removed.
    logoutApi().catch(() => {});
    localStorage.removeItem("netshield_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
