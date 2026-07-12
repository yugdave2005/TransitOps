import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-sm transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-sm';

  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white border border-transparent',
    secondary: 'bg-white hover:bg-black/5 text-text-primary border border-border',
    danger: 'bg-status-red hover:bg-red-700 text-white border border-transparent',
    ghost: 'bg-transparent hover:bg-black/5 text-text-secondary hover:text-text-primary shadow-none border-none'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1 space-x-1',
    md: 'text-xs px-3.5 py-2 space-x-1.5',
    lg: 'text-sm px-4 py-2.5 space-x-2'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
