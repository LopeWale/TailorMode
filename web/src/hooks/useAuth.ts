"use client";

import { useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  replitId: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });

      if (response.ok) {
        const user = await response.json();
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else if (response.status === 401) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      } else {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(() => {
    window.location.href = "/api/login";
  }, []);

  const logout = useCallback(() => {
    window.location.href = "/api/logout";
  }, []);

  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true }));
    fetchUser();
  }, [fetchUser]);

  return {
    ...state,
    login,
    logout,
    refetch,
  };
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}
