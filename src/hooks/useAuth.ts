import { useState, useEffect } from 'react';
import { User } from '../utils/types';
import { mockUser } from '../utils/mockUser';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    setTimeout(() => {
      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });
    }, 1000);
  }, []);

  return authState;
};