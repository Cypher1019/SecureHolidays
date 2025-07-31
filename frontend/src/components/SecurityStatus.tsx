import React from 'react';
import { useSecurity } from '../contexts/SecurityContext';
import { useSession } from '../contexts/SessionContext';

const SecurityStatus: React.FC = () => {
  const { securityLevel } = useSecurity();
  const { isAuthenticated } = useSession();

  const getSecurityIcon = () => {
    if (securityLevel === 'high') {
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (securityLevel === 'medium') {
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  const getSecurityText = () => {
    if (securityLevel === 'high') {
      return 'Secure Connection';
    } else if (securityLevel === 'medium') {
      return 'Local Development';
    } else {
      return 'Insecure Connection';
    }
  };

  const getSecurityColor = () => {
    if (securityLevel === 'high') {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (securityLevel === 'medium') {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else {
      return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  // Only show security status if user is authenticated or on sensitive pages
  if (!isAuthenticated && !window.location.pathname.includes('/register') && !window.location.pathname.includes('/sign-in')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getSecurityColor()} shadow-lg`}>
        {getSecurityIcon()}
        <span className="text-sm font-medium">{getSecurityText()}</span>
        {isAuthenticated && (
          <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            Authenticated
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityStatus; 