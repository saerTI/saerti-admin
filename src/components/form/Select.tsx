import { useState, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string; // ✅ AGREGADO para uso controlado
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value, // ✅ AGREGADO
  disabled = false,
}) => {
  // Use controlled value if provided, otherwise use defaultValue
  const [selectedValue, setSelectedValue] = useState<string>(
    value !== undefined ? value : defaultValue
  );

  // Sync internal state with controlled value prop changes
  useEffect(() => {
    if (value !== undefined) {
      console.log('Select - controlled value changed:', value);
      setSelectedValue(value);
    }
  }, [value]);

  // Sync internal state with defaultValue changes (for uncontrolled mode)
  useEffect(() => {
    if (value === undefined) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue, value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    console.log('Select - handleChange:', newValue, 'controlled mode:', value !== undefined);
    
    // Only update internal state if not controlled
    if (value === undefined) {
      setSelectedValue(newValue);
    }
    
    onChange(newValue); // Always trigger parent handler
  };

  return (
    <select
      className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
        selectedValue
          ? "text-gray-800 dark:text-white/90"
          : "text-gray-400 dark:text-gray-400"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      value={selectedValue}
      onChange={handleChange}
      disabled={disabled}
    >
      {/* Placeholder option */}
      <option
        value=""
        disabled
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {placeholder}
      </option>
      {/* Map over options */}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;