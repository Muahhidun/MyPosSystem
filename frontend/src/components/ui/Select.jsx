import React from 'react';

export const Select = ({ label, options = [], className = '', children, ...props }) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        {...props}
        className="w-full h-10 pl-3 pr-8 bg-white border border-gray-300 rounded-lg text-sm text-gray-900
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
      >
        {children || options.map((opt, idx) => (
          <option key={idx} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);
