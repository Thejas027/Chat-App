// Deprecated duplicate: prefer utils/toastInteractive exports.
// Kept as thin wrappers for compatibility to avoid duplicate implementations.
import { showChoiceToast, showInputToast, showConfirmToast } from './toastInteractive';

export const confirmToast = ({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel' } = {}) => {
  return showChoiceToast(title || message || 'Are you sure?', [
    { label: cancelText, value: false },
    { label: confirmText, value: true, className: 'bg-blue-600 text-white hover:bg-blue-700' },
  ]).then((val) => Boolean(val));
};

export const promptToast = ({ title = 'Enter value', placeholder = '', defaultValue = '', confirmText = 'Save', cancelText = 'Cancel', validate } = {}) => {
  return showInputToast(title, { initialValue: defaultValue, placeholder, confirmText, cancelText }).then((val) => {
    if (val == null) return null;
    if (validate) {
      const res = validate(val);
      if (res !== true) return null;
    }
    return val;
  });
};

export default { confirmToast, promptToast };
