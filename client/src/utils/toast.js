import toast from 'react-hot-toast';

// 🎉 Success notifications
export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    style: {
      background: '#10b981',
      color: '#fff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10b981',
    },
  });
};

// ❌ Error notifications
export const showError = (message) => {
  toast.error(message, {
    duration: 5000,
    style: {
      background: '#ef4444',
      color: '#fff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    },
  });
};

// ⚠️ Warning notifications
export const showWarning = (message) => {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    style: {
      background: '#f59e0b',
      color: '#fff',
      fontWeight: '500',
    },
  });
};

// ℹ️ Info notifications
export const showInfo = (message) => {
  toast(message, {
    icon: 'ℹ️',
    duration: 4000,
    style: {
      background: '#3b82f6',
      color: '#fff',
      fontWeight: '500',
    },
  });
};

// ⏳ Loading notifications
export const showLoading = (message) => {
  return toast.loading(message, {
    style: {
      background: '#6b7280',
      color: '#fff',
      fontWeight: '500',
    },
  });
};

// 🔄 Update existing toast
export const updateToast = (toastId, message, type = 'success') => {
  if (type === 'success') {
    toast.success(message, { id: toastId });
  } else if (type === 'error') {
    toast.error(message, { id: toastId });
  } else {
    toast(message, { id: toastId });
  }
};

// 🗑️ Dismiss toast
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

// 🧹 Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// 🎯 Custom toast with promise
export const showPromiseToast = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong!',
    },
    {
      success: {
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#fff',
        },
      },
      error: {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      },
    }
  );
};

// 📋 Handle API errors with detailed messages
export const handleApiError = (error, fallbackMessage = 'Something went wrong!') => {
  if (error?.response?.data?.message) {
    // Backend validation errors
    if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
      error.response.data.errors.forEach((err, index) => {
        setTimeout(() => showError(err), index * 100); // Stagger multiple errors
      });
    } else {
      showError(error.response.data.message);
    }
  } else if (error?.message) {
    showError(error.message);
  } else if (typeof error === 'string') {
    showError(error);
  } else {
    showError(fallbackMessage);
  }
};

// 🎯 Handle authentication specific toasts
export const authToasts = {
  loginSuccess: (userName) => showSuccess(`Welcome back, ${userName}! 👋`),
  loginError: (message) => showError(message || 'Login failed. Please check your credentials.'),
  registerSuccess: (userName) => showSuccess(`Welcome to ChatApp, ${userName}! 🎉`),
  registerError: (message) => showError(message || 'Registration failed. Please try again.'),
  logoutSuccess: () => showInfo('You have been logged out successfully. 👋'),
  sessionExpired: () => showWarning('Your session has expired. Please log in again.'),
  unauthorized: () => showError('You are not authorized to access this resource.'),
};

// 📨 Chat specific toasts
export const chatToasts = {
  messageSent: () => showSuccess('Message sent! ✓'),
  messageError: () => showError('Failed to send message. Please try again.'),
  connectionLost: () => showWarning('Connection lost. Reconnecting...'),
  connectionRestored: () => showSuccess('Connection restored! ✓'),
  userJoined: (userName) => showInfo(`${userName} joined the chat`),
  userLeft: (userName) => showInfo(`${userName} left the chat`),
};

export default toast;
