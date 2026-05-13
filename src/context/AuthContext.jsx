import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getMe, signOut as doSignOut } from '@/lib/utils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signOut = useCallback(async () => {
    await doSignOut();
  }, []);

  const refetch = useCallback(async () => {
    const u = await getMe();
    setUser(u);
    return u;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
