function Input({
  label = "",
  name = "",
  type = "text",
  className = "",
  isRequired = false,
  placeholder = "",
  value = "",
  onChange = () => {},
}) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={name}
        className="block mb-1 text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-purple-500 focus:border-purple-500 block w-full p-2 transition-all duration-300 focus:bg-white focus:shadow-md ${className}`}
        placeholder={placeholder}
        required={isRequired}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default Input;
