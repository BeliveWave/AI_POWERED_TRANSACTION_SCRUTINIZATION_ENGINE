import React from 'react';
import { Button as ShadcnButton } from '../ui/button';
import { cn } from '../../lib/utils';

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
  // Map legacy variants to shadcn variants
  const variantMap = {
    primary: 'default',
    secondary: 'secondary',
    danger: 'destructive',
    destructive: 'destructive',
    success: 'outline',
    outline: 'outline',
    ghost: 'ghost',
  };

  const sizeMap = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
    icon: 'icon',
  };

  return (
    <ShadcnButton
      type={type}
      variant={variantMap[variant] || 'default'}
      size={sizeMap[size] || 'default'}
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {Icon && <Icon className="mr-1.5 h-4 w-4" />}
      {children}
    </ShadcnButton>
  );
};

export default Button;