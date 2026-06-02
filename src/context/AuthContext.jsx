/**
 * @file React context for Google authentication state.
 * Wraps the GoogleAuth singleton into a reactive context so components
 * can read user state and trigger sign-in / sign-out.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import googleAuth from '../services/google-auth.js';
import config from '../config/api.js';

/** @type {React.Context} */
const AuthContext = createContext(null);

/**
 * AuthProvider — wraps children with authentication state.
 *
 * On mount it initialises Google Identity Services. The user object,
 * accessToken, and loading flag are all kept in state and updated
 * whenever auth status changes (sign-in, sign-out, token refresh).
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // -----------------------------------------------------------------------
  // Auth-change callback (called by the GoogleAuth singleton)
  // -----------------------------------------------------------------------
  const handleAuthChange = useCallback(({ isSignedIn, accessToken: token, profile }) => {
    if (isSignedIn && profile) {
      setUser({
        name: profile.name ?? '',
        email: profile.email ?? '',
        picture: profile.picture ?? '',
        isLoggedIn: true,
      });
      setAccessToken(token);
    } else {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Initialise on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      try {
        await googleAuth.initGoogleAuth(config.google.clientId, handleAuthChange);

        // If a session still exists (e.g. token in memory), hydrate state
        if (googleAuth.isSignedIn()) {
          const profile = await googleAuth.getUserProfile();
          if (!cancelled && profile) {
            setUser({
              name: profile.name ?? '',
              email: profile.email ?? '',
              picture: profile.picture ?? '',
              isLoggedIn: true,
            });
            setAccessToken(googleAuth.getAccessToken());
          }
        }
      } catch (error) {
        console.error('[AuthContext] init failed:', error.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    initAuth();
    return () => {
      cancelled = true;
    };
  }, [handleAuthChange]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------
  const login = useCallback(async () => {
    setIsLoading(true);
    try {
      const profile = await googleAuth.signIn();
      if (profile) {
        setUser({
          name: profile.name ?? '',
          email: profile.email ?? '',
          picture: profile.picture ?? '',
          isLoggedIn: true,
        });
        setAccessToken(googleAuth.getAccessToken());
      }
      return profile;
    } catch (error) {
      console.error('[AuthContext] login failed:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    googleAuth.signOut();
    setUser(null);
    setAccessToken(null);
  }, []);

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------
  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: !!user?.isLoggedIn,
      login,
      logout,
    }),
    [user, accessToken, isLoading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication state and actions.
 * Must be used inside an `<AuthProvider>`.
 * @returns {{ user: object|null, accessToken: string|null, isLoading: boolean, isAuthenticated: boolean, login: Function, logout: Function }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
