import React from 'react';

const Card = ({ children, className = '', onClick, ...props }) => {
  const classes = `bg-white rounded-lg border border-gray-200 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`;
  
  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

export default Card;