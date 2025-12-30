import React from 'react';

export const Input = ({ label, error, className = '', ...props }) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
    )}
    <input
      {...props}
      className={`w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900
      placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      transition-all disabled:bg-gray-50 disabled:text-gray-500 ${error ? 'border-red-500 focus:ring-red-200' : ''}`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);
