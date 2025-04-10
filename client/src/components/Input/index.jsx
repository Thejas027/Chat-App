function Input({
  label = "",
  name = "",
  type = "text",
  inputClassName = "",
  className = "",
  isRequired = false,
  placeholder = "",
  value = "",
  onChange = () => {},
}) {
  return (
    <div className="flex flex-col">
      {label && (
        <label
          htmlFor={name}
          className={`block mb-1 text-sm font-medium text-gray-700 ${className} w-full`}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-blue-500 focus:border-blue-500 block w-92 p-3 transition-all duration-300 focus:bg-white focus:shadow-md ${inputClassName}`}
        placeholder={placeholder}
        required={isRequired}
        value={value} // Ensure the value is bound to the prop
        onChange={onChange} // Ensure the onChange handler is called
      />
    </div>
  );
}

export default Input;
