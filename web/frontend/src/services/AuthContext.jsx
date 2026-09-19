import { createContext, useContext, useMemo, useState } from "react";
import { clearSession, loadSession, saveSession } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());

  const value = useMemo(() => {
    const update = (next) => {
      setSession(next);
      saveSession(next);
    };

    return {
      loggedIn: Boolean(session.loggedIn),
      mfaVerified: Boolean(session.mfaVerified),
      login: () => update({ loggedIn: true, mfaVerified: false }),
      markMfaSuccess: () => update({ loggedIn: true, mfaVerified: true }),
      logout: () => {
        clearSession();
        setSession({ loggedIn: false, mfaVerified: false });
      },
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
