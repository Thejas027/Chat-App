import React from 'react';
import toast from 'react-hot-toast';

// Simple confirm toast (Yes/No) -> Promise<boolean>
export const showConfirmToast = (
  message,
  { yesText = 'Yes', noText = 'Cancel', duration = 8000 } = {}
) => {
  return new Promise((resolve) => {
    toast((t) => (
      <div className="min-w-[220px]">
        <div className="mb-2">{message}</div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(false);
            }}
            className="px-3 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            {noText}
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(true);
            }}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {yesText}
          </button>
        </div>
      </div>
    ), { duration });
  });
};

// Choice toast: returns the chosen value -> Promise<any>
export const showChoiceToast = (message, choices = [], { duration = 10000 } = {}) => {
  return new Promise((resolve) => {
    toast((t) => (
      <div className="min-w-[260px]">
        <div className="mb-2">{message}</div>
        <div className="flex gap-2 justify-end flex-wrap">
          {choices.map((c, idx) => (
            <button
              key={idx}
              onClick={() => {
                toast.dismiss(t.id);
                resolve(c.value);
              }}
              className={`px-3 py-1 rounded ${c.className || 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    ), { duration });
  });
};

// Input toast for quick edits; resolves with string or null -> Promise<string|null>
export const showInputToast = (
  title,
  { initialValue = '', placeholder = 'Type here...', confirmText = 'Save', cancelText = 'Cancel', duration = 15000 } = {}
) => {
  return new Promise((resolve) => {
    let value = initialValue;
    toast((t) => (
      <div className="min-w-[280px]">
        <div className="mb-2 font-medium">{title}</div>
        <input
          type="text"
          defaultValue={initialValue}
          placeholder={placeholder}
          onChange={(e) => {
            value = e.target.value;
          }}
          className="w-full px-3 py-2 rounded border border-gray-300 text-gray-900"
          autoFocus
        />
        <div className="mt-2 flex gap-2 justify-end">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(null);
            }}
            className="px-3 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(value);
            }}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    ), { duration });
  });
};
