import { showSuccess, showError, showWarning, showInfo, authToasts, chatToasts } from '../../utils/toast';

const ToastTester = () => {
  const testToasts = [
    { label: 'Success', action: () => showSuccess('Operation completed successfully! ✅') },
    { label: 'Error', action: () => showError('Something went wrong! ❌') },
    { label: 'Warning', action: () => showWarning('Please be careful! ⚠️') },
    { label: 'Info', action: () => showInfo('Here is some information ℹ️') },
    { label: 'Login Success', action: () => authToasts.loginSuccess('John Doe') },
    { label: 'Login Error', action: () => authToasts.loginError('Invalid credentials') },
    { label: 'Register Success', action: () => authToasts.registerSuccess('Jane Smith') },
    { label: 'Validation Error', action: () => authToasts.registerError('Password must be at least 6 characters') },
    { label: 'Session Expired', action: () => authToasts.sessionExpired() },
    { label: 'Message Sent', action: () => chatToasts.messageSent() },
    { label: 'Connection Lost', action: () => chatToasts.connectionLost() },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs">
      <h3 className="text-sm font-semibold mb-3 text-gray-800">Toast Tester</h3>
      <div className="space-y-2">
        {testToasts.map((toast, index) => (
          <button
            key={index}
            onClick={toast.action}
            className="w-full text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {toast.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ToastTester;
