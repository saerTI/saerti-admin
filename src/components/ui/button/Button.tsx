import React, { ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

// Define props for Button component
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  to?: string; // For Link buttons
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  startIcon?: React.ReactNode; // Alias for leftIcon
  endIcon?: React.ReactNode; // Alias for rightIcon
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  to,
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  startIcon, // Alias for leftIcon
  endIcon, // Alias for rightIcon
  fullWidth = false,
  ...props
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500';
  
  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800'
  };
  
  // Disabled classes
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  // Loading classes
  const loadingClasses = 'relative text-transparent transition-none hover:text-transparent';
  
  // Full width class
  const fullWidthClass = fullWidth ? 'w-full' : '';
  
  // Combine classes
  const allClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${isDisabled ? disabledClasses : ''}
    ${isLoading ? loadingClasses : ''}
    ${fullWidthClass}
    ${className}
  `.trim();
  
  // Use startIcon as an alias for leftIcon, and endIcon as an alias for rightIcon
  const finalLeftIcon = leftIcon || startIcon;
  const finalRightIcon = rightIcon || endIcon;

  // If it's a link, render a Link component
  if (to && !isDisabled) {
    return (
      <Link to={to} className={allClasses}>
        {finalLeftIcon && <span className="mr-2">{finalLeftIcon}</span>}
        {children}
        {finalRightIcon && <span className="ml-2">{finalRightIcon}</span>}
      </Link>
    );
  }
  
  // Loading spinner
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
  
  // Render a button
  return (
    <button
      className={allClasses}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner />}
      {finalLeftIcon && <span className="mr-2">{finalLeftIcon}</span>}
      {children}
      {finalRightIcon && <span className="ml-2">{finalRightIcon}</span>}
    </button>
  );
};

export default Button;