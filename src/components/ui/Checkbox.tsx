interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Checkbox({
  label,
  error,
  className = "",
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={checkboxId}
        className="flex items-center gap-3 cursor-pointer"
      >
        <div className="relative flex items-center">
          <input
            id={checkboxId}
            type="checkbox"
            className={`peer h-5 w-5 cursor-pointer appearance-none rounded border border-brand-gray-300 transition-all duration-200 checked:border-brand-orange checked:bg-brand-orange hover:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 ${
              error ? "border-red-500" : ""
            } ${className}`}
            {...props}
          />
          {/* Checkmark icon */}
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        {label && (
          <span className="text-sm text-brand-gray-700 select-none">
            {label}
          </span>
        )}
      </label>
      {error && <p className="text-sm text-red-500 ml-8">{error}</p>}
    </div>
  );
}
