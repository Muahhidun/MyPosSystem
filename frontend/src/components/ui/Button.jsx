import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'md', className = '', disabled = false, ...props }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const baseClasses = "rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base"
  };

  const variantStyles = {
    primary: {
      backgroundColor: isHovered && !disabled ? '#164d58' : '#1f6b7a',
      color: '#ffffff'
    },
    secondary: {
      backgroundColor: isHovered && !disabled ? '#e0f2f4' : 'transparent',
      color: '#1f6b7a',
      border: '1px solid #1f6b7a'
    },
    danger: {
      backgroundColor: isHovered && !disabled ? '#dc2626' : '#ef4444',
      color: '#ffffff'
    },
    ghost: {
      backgroundColor: isHovered && !disabled ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
      color: '#64748b'
    },
    ai: {
      backgroundColor: isHovered && !disabled ? '#7c3aed' : '#8b5cf6',
      color: '#ffffff'
    }
  };

  const style = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
