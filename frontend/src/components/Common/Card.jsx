import React from 'react';

const Card = ({ children, className = '', onClick, ...props }) => {
  const classes = `bg-white dark:bg-slate-800/80 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md dark:hover:shadow-slate-900 transition-shadow' : ''} backdrop-blur-sm ${className}`;
  
  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

export default Card;