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
        className={`bg-purple-600 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-purple-700 hover:scale-105 transition-transform duration-300  ${className}`}
        disabled={disabled}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );
}

export default Button;
