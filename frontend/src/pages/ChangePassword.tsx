import React, { useState } from 'react';
import { useMutation } from 'react-query';
import * as apiClient from '../api-client';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import SecurePasswordInput from '../components/SecurePasswordInput';
import { useSession } from '../contexts/SessionContext';



const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const { userId } = useSession();

  const mutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      apiClient.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      showToast({ message: 'Password changed successfully!', type: 'SUCCESS' });
      navigate('/');
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: 'ERROR' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate current password
    if (!currentPassword) {
      showToast({ message: 'Current password is required', type: 'ERROR' });
      return;
    }
    
    // Validate new password
    if (!isNewPasswordValid) {
      showToast({ message: 'Please fix password validation errors', type: 'ERROR' });
      return;
    }
    
    // Validate password match
    if (newPassword !== confirmPassword) {
      showToast({ message: 'New passwords do not match', type: 'ERROR' });
      return;
    }
    
    // Validate that new password is different from current
    if (currentPassword === newPassword) {
      showToast({ message: 'New password must be different from current password', type: 'ERROR' });
      return;
    }
    
    mutation.mutate({ currentPassword, newPassword });
  };

  if (!userId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">You must be logged in to change your password.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-center mb-6">Change Password</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showCurrentPassword ? (
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
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <SecurePasswordInput
            value={newPassword}
            onChange={setNewPassword}
            onValidationChange={setIsNewPasswordValid}
            placeholder="Enter your new password"
            required={true}
          />
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <SecurePasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm your new password"
            required={true}
            showStrengthIndicator={false}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <span className="text-red-500 text-sm mt-1">Passwords do not match</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={mutation.isLoading || !isNewPasswordValid || newPassword !== confirmPassword}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {mutation.isLoading ? 'Changing Password...' : 'Change Password'}
        </button>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </form>

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Security Notice:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Your new password must meet all security requirements</li>
          <li>• Password history is tracked to prevent reuse</li>
          <li>• Your session will remain active after password change</li>
          <li>• Consider logging out and back in for enhanced security</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangePassword; 