interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-brand-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-brand-gray-900 placeholder:text-brand-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all duration-200 ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "border-brand-gray-300 focus:border-brand-orange"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-brand-gray-500">{helperText}</p>
      )}
    </div>
  );
}
