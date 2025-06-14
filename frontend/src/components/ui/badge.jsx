import React from "react";

export const Badge = ({ 
  children, 
  className = "", 
  variant = "default", 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
  
  const variants = {
    default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border-transparent bg-gray-600 text-gray-100 hover:bg-gray-500",
    destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
    outline: "border-gray-600 text-gray-200 hover:bg-gray-700"
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};