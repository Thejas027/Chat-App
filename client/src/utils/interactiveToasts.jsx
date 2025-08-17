import React, { useState } from 'react';
import toast from 'react-hot-toast';

export const confirmToast = ({
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  duration = 10000,
} = {}) => {
  return new Promise((resolve) => {
    const id = toast.custom((t) => (
      <div className={`max-w-sm w-full bg-white rounded-xl shadow-lg border p-3 ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        {message ? <div className="mt-1 text-sm text-gray-600">{message}</div> : null}
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => { toast.dismiss(id); resolve(false); }}
            className="px-3 py-1.5 text-sm rounded-md border bg-white text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { toast.dismiss(id); resolve(true); }}
            className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    ), { duration, position: 'top-right' });
  });
};

export const promptToast = ({
  title = 'Enter value',
  placeholder = '',
  defaultValue = '',
  confirmText = 'Save',
  cancelText = 'Cancel',
  validate,
  duration = 20000,
} = {}) => {
  return new Promise((resolve) => {
    const Prompt = () => {
      const [value, setValue] = useState(defaultValue);
      const [error, setError] = useState('');
      const onConfirm = () => {
        const v = value ?? '';
        if (validate) {
          const res = validate(v);
          if (res !== true) { setError(typeof res === 'string' ? res : 'Invalid'); return; }
        }
        toast.dismiss(id);
        resolve(v);
      };
      return (
        <div className="max-w-sm w-full bg-white rounded-xl shadow-lg border p-3">
          <div className="text-sm font-medium text-gray-900">{title}</div>
          <input
            autoFocus
            className="mt-2 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder}
            defaultValue={defaultValue}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); }}
          />
          {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => { toast.dismiss(id); resolve(null); }} className="px-3 py-1.5 text-sm rounded-md border bg-white text-gray-700 hover:bg-gray-50">{cancelText}</button>
            <button onClick={onConfirm} className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">{confirmText}</button>
          </div>
        </div>
      );
    };
    const id = toast.custom((t) => <Prompt />, { duration, position: 'top-right' });
  });
};

export default { confirmToast, promptToast };
