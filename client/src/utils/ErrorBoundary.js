import { showError, showWarning } from '../utils/toast';

class ErrorBoundary {
  static initialize() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Show user-friendly error message
      if (event.reason?.message) {
        if (event.reason.message.includes('fetch')) {
          showError('Network error. Please check your connection.');
        } else {
          showError('Something went wrong. Please try again.');
        }
      } else {
        showError('An unexpected error occurred.');
      }
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      showError('Something went wrong. Please refresh the page.');
    });

    // Handle network status changes
    window.addEventListener('online', () => {
      showWarning('Connection restored! 🌐');
    });

    window.addEventListener('offline', () => {
      showWarning('You are offline. Please check your connection. 📶');
    });
  }
}

export default ErrorBoundary;
