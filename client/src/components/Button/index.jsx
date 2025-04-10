function Button({
  label = "Button",
  type = "button",
  className = "",
  disabled = false,
  onClick = () => {},
}) {
  return (
    <div>
      <button
        type={type}
        className={`bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-blue-700 transition-transform duration-300  ${className}`}
        disabled={disabled}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );
}

export default Button;
