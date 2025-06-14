import React from "react";

export const ScrollArea = ({ 
  children, 
  className = "", 
  ...props 
}) => {
  return (
    <div
      className={`relative overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};