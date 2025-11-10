import React from 'react';

export const SimpleSelect = ({ children, onValueChange, placeholder, className = "" }) => (
  <select
    onChange={(e) => onValueChange(e.target.value)}
    className={`flex h-10 w-[180px] items-center justify-between rounded-md border border-blue-500/20 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  >
    <option value="">{placeholder || "Seçiniz"}</option>
    {children}
  </select>
);

export const SimpleSelectItem = ({ children, value }) => (
  <option value={value}>{children}</option>
);

