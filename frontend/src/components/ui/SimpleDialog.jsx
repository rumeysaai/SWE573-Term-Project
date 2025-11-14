import React from 'react';

export const SimpleDialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div
      onClick={() => onOpenChange(false)}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-50 grid w-full max-w-2xl max-h-[90vh] gap-4 overflow-y-auto rounded-lg border bg-white p-6 shadow-lg"
      >
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <span className="text-2xl">&times;</span>
        </button>
      </div>
    </div>
  );
};

export const SimpleDialogHeader = ({ children }) => (
  <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>
);

export const SimpleDialogTitle = ({ children }) => (
  <h2 className="text-2xl font-semibold leading-none tracking-tight mb-2">{children}</h2>
);

export const SimpleDialogDescription = ({ children }) => (
  <div className="text-sm text-gray-500 flex items-center gap-2">{children}</div>
);

