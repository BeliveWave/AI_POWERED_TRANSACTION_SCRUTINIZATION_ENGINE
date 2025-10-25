import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm gap-1',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  const classes = [
    baseClasses,
    variants[variant],
    sizes[size],
    className
  ].join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : size === 'md' ? 18 : 20} />}
      {children}
    </button>
  );
};

export default Button;