import { apiRequest } from './client';

export interface User {
  id: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const authApi = {
  /**
   * Get the current authenticated user.
   * Returns user info if authenticated, throws 401 if not.
   */
  getCurrentUser: () => apiRequest<User>('/auth/me'),

  /**
   * Login with email and password.
   * Returns user info on success, sets session cookie.
   */
  login: (credentials: LoginRequest) =>
    apiRequest<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  /**
   * Logout the current user.
   * Clears the session on the server.
   */
  logout: () =>
    apiRequest<void>('/auth/logout', {
      method: 'POST',
    }),
};
