import React from 'react';
import { Badge as ShadcnBadge } from '../ui/badge';

const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const variantMap = {
    default: 'secondary',
    success: 'success',
    warning: 'warning',
    danger: 'destructive',
    destructive: 'destructive',
    info: 'outline',
    outline: 'outline',
  };

  return (
    <ShadcnBadge
      variant={variantMap[variant] || 'secondary'}
      className={className}
      {...props}
    >
      {children}
    </ShadcnBadge>
  );
};

export default Badge;