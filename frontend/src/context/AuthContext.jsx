import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children, initialUser = null, initialLoading = false, skipCheck = false }) {
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only check auth status on browser if not pre-seeded and not skipped
    if (!skipCheck && typeof window !== 'undefined' && initialUser === null && initialLoading === false) {
      checkAuth();
    }
  }, [skipCheck]);

  async function checkAuth() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.data?.user || null);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.message || 'Login failed. Please check your credentials.';
        setError(message);
        return { success: false, error: message };
      }

      setUser(data.data?.user);
      return { success: true, user: data.data?.user };
    } catch (err) {
      const message = err.message || 'Network error during login.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
    } catch (err) {
      // ignore network errors on logout
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
