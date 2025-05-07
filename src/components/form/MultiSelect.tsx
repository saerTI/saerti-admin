import React, { useState, useEffect, useRef, useCallback } from "react";

interface Option {
  value: string;
  text: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
  placeholder = "Select option",
  className = "",
}) => {
  // Create a stable initial state for selected options
  const [selectedOptions, setSelectedOptions] = useState<string[]>(defaultSelected);
  const [isOpen, setIsOpen] = useState(false);
  
  // Refs for the main component and dropdown
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Update selected options if defaultSelected changes (e.g., from parent)
  useEffect(() => {
    setSelectedOptions(defaultSelected);
  }, [JSON.stringify(defaultSelected)]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    // Only attach listener when dropdown is open
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    // Use capture phase to ensure we get the event before other handlers
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isOpen]);
  
  // Toggle dropdown with controlled propagation
  const toggleDropdown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    // Stop propagation to prevent parent elements from receiving the click
    e.stopPropagation();
    e.preventDefault();
    
    setIsOpen(prev => !prev);
  }, [disabled]);
  
  // Handle option selection with explicit propagation control
  const handleOptionSelect = useCallback((optionValue: string, e: React.MouseEvent) => {
    // Prevent event from bubbling up and triggering other handlers
    e.stopPropagation();
    e.preventDefault();
    
    setSelectedOptions(prev => {
      // Toggle the selected state
      const isSelected = prev.includes(optionValue);
      const newSelected = isSelected
        ? prev.filter(value => value !== optionValue)
        : [...prev, optionValue];
        
      // Call onChange callback with new selection
      if (onChange) {
        onChange(newSelected);
      }
      
      return newSelected;
    });
    
    // Critical: Don't close the dropdown after selection
  }, [onChange]);
  
  // Handle removing a selected option
  const removeOption = useCallback((value: string, e: React.MouseEvent) => {
    // Prevent the click from toggling the dropdown
    e.stopPropagation();
    e.preventDefault();
    
    setSelectedOptions(prev => {
      const newSelected = prev.filter(v => v !== value);
      if (onChange) {
        onChange(newSelected);
      }
      return newSelected;
    });
  }, [onChange]);
  
  // Get display texts for selected values
  const selectedTexts = selectedOptions.map(value => 
    options.find(option => option.value === value)?.text || ""
  );

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {/* Label */}
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>

      {/* Main container with higher z-index */}
      <div className="relative z-30 w-full">
        {/* Dropdown trigger */}
        <div 
          onClick={toggleDropdown}
          className={`flex h-11 rounded-lg border border-gray-300 mb-2 cursor-pointer shadow-theme-xs transition hover:border-gray-400 focus:border-brand-300 focus:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600 ${
            selectedOptions.length > 0 
              ? "text-gray-800 dark:text-white/90" 
              : "text-gray-400 dark:text-gray-400"
          }`}
        >
          <div className="flex flex-wrap flex-auto gap-2 py-1.5 pl-3 pr-3 overflow-hidden">
            {selectedTexts.length > 0 ? (
              selectedTexts.map((text, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-center rounded-full border-[0.7px] border-transparent bg-gray-100 py-1 pl-2.5 pr-2 text-sm text-gray-800 hover:border-gray-200 dark:bg-gray-800 dark:text-white/90 dark:hover:border-gray-800"
                >
                  <span className="flex-initial max-w-full">{text}</span>
                  <div className="flex flex-row-reverse flex-auto">
                    <button
                      type="button"
                      onClick={(e) => removeOption(selectedOptions[index], e)}
                      className="pl-2 text-gray-500 cursor-pointer group-hover:text-gray-400 dark:text-gray-400"
                    >
                      <svg
                        className="fill-current"
                        role="button"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="select-none">
                {placeholder}
              </div>
            )}
          </div>
          
          {/* Dropdown arrow */}
          <div className="flex items-center py-1 px-2 mr-1">
            <svg
              className={`stroke-current transition-transform ${isOpen ? "rotate-180" : ""}`}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Dropdown menu with proper positioning and z-index */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-0 z-50 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto dark:bg-gray-900"
            style={{ top: "calc(100% - 8px)" }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={(e) => handleOptionSelect(option.value, e)}
                className={`px-3 py-2 text-sm cursor-pointer border-b border-gray-200 dark:border-gray-800 ${
                  selectedOptions.includes(option.value)
                    ? "bg-gray-100 dark:bg-gray-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                }`}
              >
                {option.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;