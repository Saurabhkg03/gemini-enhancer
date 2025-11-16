'use client';
import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', disabled, ...props }) => {
    const variants = {
        primary: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-200/50 dark:shadow-none disabled:shadow-none disabled:from-slate-400 disabled:to-slate-500 dark:disabled:from-slate-600 dark:disabled:to-slate-700",
        success: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-200/50 dark:shadow-none disabled:shadow-none disabled:from-slate-400 disabled:to-slate-500 dark:disabled:from-slate-600 dark:disabled:to-slate-700",
        outline: "border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:border-slate-100 dark:disabled:border-slate-800",
        ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:hover:bg-transparent",
    };
    return (
        <button 
            disabled={disabled}
            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:pointer-events-none ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};