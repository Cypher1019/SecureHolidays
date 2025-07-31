import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppContext } from './AppContext';

interface SecurityContextType {
  csrfToken: string | null;
  generateCSRFToken: () => string;
  validateCSRFToken: (token: string) => boolean;
  sanitizeInput: (input: string) => string;
  validateEmail: (email: string) => boolean;
  validatePassword: (password: string, username?: string) => { isValid: boolean; errors: string[] };
  isSecureConnection: boolean;
  securityLevel: 'low' | 'medium' | 'high';
  logSecurityEvent: (event: string, details?: any) => void;
  checkPasswordStrength: (password: string) => 'weak' | 'medium' | 'strong';
  encryptSensitiveData: (data: string) => string;
  decryptSensitiveData: (encryptedData: string) => string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isSecureConnection, setIsSecureConnection] = useState(false);
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const { showToast } = useAppContext();

  // Check if connection is secure (HTTPS)
  useEffect(() => {
    setIsSecureConnection(window.location.protocol === 'https:');
    
    if (!isSecureConnection && window.location.hostname !== 'localhost') {
      showToast({
        message: 'Warning: This site is not using a secure connection',
        type: 'ERROR'
      });
    }
  }, [isSecureConnection, showToast]);

  // Generate CSRF token
  const generateCSRFToken = (): string => {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15) +
                  Date.now().toString(36);
    setCsrfToken(token);
    return token;
  };

  // Validate CSRF token
  const validateCSRFToken = (token: string): boolean => {
    return token === csrfToken && token.length >= 32;
  };

  // Input sanitization
  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  };

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Enhanced password validation (8-16 characters)
  const validatePassword = (password: string, username?: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check length (8-16 characters)
    if (password.length < 8 || password.length > 16) {
      errors.push('Password must be between 8 and 16 characters long');
    }
    
    // Check for lowercase characters
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for uppercase characters
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for numbers
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    // Check for special characters
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    // Check if password is same as username
    if (username && password.toLowerCase() === username.toLowerCase()) {
      errors.push('Password cannot be the same as username');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Password strength checker
  const checkPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    if (password.length >= 12) score++;
    if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) score++;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  };

  // Simple encryption for sensitive data (for demo purposes)
  const encryptSensitiveData = (data: string): string => {
    return btoa(encodeURIComponent(data));
  };

  // Simple decryption for sensitive data (for demo purposes)
  const decryptSensitiveData = (encryptedData: string): string => {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch {
      return '';
    }
  };

  // Security event logging
  const logSecurityEvent = (event: string, details?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      secure: isSecureConnection
    };
    
    console.log('[SECURITY]', logEntry);
    
    // In a real application, you would send this to a security monitoring service
    // For now, we'll just log it to console
  };

  // Set security level based on various factors
  useEffect(() => {
    let level: 'low' | 'medium' | 'high' = 'medium';
    
    if (isSecureConnection) {
      level = 'high';
    } else if (window.location.hostname === 'localhost') {
      level = 'medium';
    } else {
      level = 'low';
    }
    
    setSecurityLevel(level);
  }, [isSecureConnection]);

  const value: SecurityContextType = {
    csrfToken,
    generateCSRFToken,
    validateCSRFToken,
    sanitizeInput,
    validateEmail,
    validatePassword,
    isSecureConnection,
    securityLevel,
    logSecurityEvent,
    checkPasswordStrength,
    encryptSensitiveData,
    decryptSensitiveData
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}; 