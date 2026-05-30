import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "guest" | "user" | "client" | "admin";

export interface UserSession {
  role: UserRole;
  email: string | null;
  name: string | null;
}

interface AuthContextProps {
  userRole: UserRole;
  userSession: UserSession;
  login: (role: UserRole, email: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userSession, setUserSession] = useState<UserSession>({
    role: "guest",
    email: null,
    name: null,
  });

  // Load session from sessionStorage to survive simple single-tab soft reloads,
  // but keep it memory-first as requested for fresh sessions.
  useEffect(() => {
    const saved = sessionStorage.getItem("parity_ai_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && parsed.role) {
          setUserSession(parsed);
        }
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, []);

  const login = (role: UserRole, email: string, name: string) => {
    const newSession = { role, email, name };
    setUserSession(newSession);
    sessionStorage.setItem("parity_ai_session", JSON.stringify(newSession));
  };

  const logout = () => {
    const freshSession = { role: "guest" as const, email: null, name: null };
    setUserSession(freshSession);
    sessionStorage.removeItem("parity_ai_session");
  };

  return (
    <AuthContext.Provider
      value={{
        userRole: userSession.role,
        userSession,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
