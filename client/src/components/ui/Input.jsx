import PropTypes from 'prop-types';

const Input = ({ 
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  leftIcon,
  rightIcon,
  ...props 
}) => {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = 'block w-full py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors';
  const errorClasses = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '';
  const disabledClasses = disabled ? 'bg-gray-50 cursor-not-allowed' : '';

  const paddingLeft = leftIcon ? 'pl-10' : 'px-3';
  const paddingRight = rightIcon ? 'pr-10' : 'px-3';
  const inputClasses = `${baseClasses} ${paddingLeft} ${paddingRight} ${errorClasses} ${disabledClasses} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />
        {rightIcon && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
};

export default Input;
