import React, { useState, useEffect } from 'react';
import { useSecurity } from '../contexts/SecurityContext';
import PasswordStrengthBar from 'react-password-strength-bar';

interface SecurePasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  className?: string;
  showStrengthIndicator?: boolean;
  required?: boolean;
  disabled?: boolean;
  username?: string; // For username comparison
}

const SecurePasswordInput: React.FC<SecurePasswordInputProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = "Enter password",
  className = "",
  showStrengthIndicator = true,
  required = false,
  disabled = false,
  username
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { validatePassword, logSecurityEvent } = useSecurity();

  const validation = validatePassword(value, username);

  useEffect(() => {
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Log password change attempts
    if (newValue.length > 0) {
      logSecurityEvent('PASSWORD_INPUT', { length: newValue.length });
    }
  };



  return (
    <div className="w-full">
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
            ${validation.isValid ? 'border-green-500' : value.length > 0 ? 'border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          autoComplete="new-password"
          data-lpignore="true"
          data-form-type="other"
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          disabled={disabled}
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Password Strength Bar */}
      {showStrengthIndicator && value.length > 0 && (
        <div className="mt-2">
          <PasswordStrengthBar 
            password={value}
            className="mt-2"
            barColors={['#ddd', '#ff4d4d', '#ffa726', '#9ee6a3', '#57bd84']}
            scoreWords={['very weak', 'weak', 'medium', 'strong', 'very strong']}
            shortScoreWord="too short"
          />
        </div>
      )}

      {/* Validation Errors */}
      {value.length > 0 && !validation.isValid && (
        <div className="mt-2">
          <ul className="text-sm text-red-600 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Security Tips */}
      {isFocused && value.length === 0 && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Between 8 and 16 characters long</li>
            <li>• Contains uppercase and lowercase letters</li>
            <li>• Contains at least one number</li>
            <li>• Contains at least one special character (@$!%*?&)</li>
            <li>• Cannot be the same as your username</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SecurePasswordInput; 