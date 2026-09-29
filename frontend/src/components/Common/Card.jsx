import React from 'react';
import { Card as ShadcnCard } from '../ui/card';
import { cn } from '../../lib/utils';

const Card = ({ children, className = '', onClick, ...props }) => {
  return (
    <ShadcnCard
      className={cn(
        onClick && "cursor-pointer transition-colors hover:bg-muted/50",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </ShadcnCard>
  );
};

export default Card;