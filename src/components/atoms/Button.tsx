// src/components/atoms/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  fullWidth = false,
  type = 'button'
}: ButtonProps) => {
  
  // Estilos base que siempre tendrá el botón
  const baseStyles = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform active:scale-95 shadow-md";
  
  // Variantes de color (Usando el azul cyan del logo PCA)
  const variants = {
    primary: "bg-cyan-500 text-white hover:bg-cyan-600 hover:shadow-lg",
    secondary: "bg-slate-800 text-white hover:bg-slate-700",
    outline: "border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-50"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
};