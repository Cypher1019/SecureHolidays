import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSecurity } from './SecurityContext';

interface SessionContextType {
  isAuthenticated: boolean;
  userId: string | null;
  sessionToken: string | null;
  jwtToken: string | null;
  login: (userId: string, sessionToken: string, jwtToken?: string) => void;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  getAuthHeaders: () => Record<string, string>;
  validateSession: () => Promise<boolean>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  

  const { logSecurityEvent } = useSecurity();

  // Initialize session from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedJwtToken = localStorage.getItem('jwtToken');
    
    if (storedUserId && storedJwtToken) {
      setUserId(storedUserId);
      setJwtToken(storedJwtToken);
      setIsAuthenticated(true);
      logSecurityEvent('SESSION_RESTORED', { userId: storedUserId });
    }
  }, [logSecurityEvent]);

  const login = (userId: string, sessionToken: string, jwtToken?: string) => {
    setUserId(userId);
    setSessionToken(sessionToken);
    if (jwtToken) {
      setJwtToken(jwtToken);
      localStorage.setItem('jwtToken', jwtToken);
    }
    localStorage.setItem('userId', userId);
    setIsAuthenticated(true);
    
    logSecurityEvent('USER_LOGIN', { userId });
  };

  const logout = () => {
    setUserId(null);
    setSessionToken(null);
    setJwtToken(null);
    setIsAuthenticated(false);
    
    localStorage.removeItem('userId');
    localStorage.removeItem('jwtToken');
    
    logSecurityEvent('USER_LOGOUT', { userId });
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/validate-token`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId);
          setIsAuthenticated(true);
          logSecurityEvent('SESSION_REFRESHED', { userId: data.userId });
          return true;
        }
      }
      
      // If session validation fails, try JWT fallback
      if (jwtToken) {
        const jwtResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/validate-jwt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          }
        });
        
        if (jwtResponse.ok) {
          const jwtData = await jwtResponse.json();
          if (jwtData.userId) {
            setUserId(jwtData.userId);
            setIsAuthenticated(true);
            logSecurityEvent('JWT_FALLBACK_SUCCESS', { userId: jwtData.userId });
            return true;
          }
        }
      }
      
      logout();
      return false;
    } catch (error) {
      logSecurityEvent('SESSION_REFRESH_ERROR', { error: (error as Error).message });
      logout();
      return false;
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Try session first, then JWT fallback
    if (sessionToken) {
      headers['X-Session-Token'] = sessionToken;
    } else if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
    }
    
    return headers;
  };

  const validateSession = async (): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }
    
    return await refreshSession();
  };

  // Auto-refresh session every 5 minutes
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        refreshSession();
      }, 5 * 60 * 1000); // 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const value: SessionContextType = {
    isAuthenticated,
    userId,
    sessionToken,
    jwtToken,
    login,
    logout,
    refreshSession,
    getAuthHeaders,
    validateSession
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}; 