import React from 'react';

export const SimpleAvatar = ({ src, fallback, className = "" }) => {
  const sizeClass = className.includes('w-') ? '' : 'h-12 w-12';
  return (
    <div className={`relative flex ${sizeClass} shrink-0 overflow-hidden rounded-full border-2 border-primary/20 ${className}`}>
      <img 
        className="aspect-square h-full w-full" 
        src={src} 
        alt="Kullanıcı avatarı" 
        onError={(e) => {
          e.currentTarget.src = `https://placehold.co/100x100/EBF8FF/3B82F6?text=${fallback}`;
        }} 
      />
    </div>
  );
};

