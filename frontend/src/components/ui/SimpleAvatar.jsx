import React from 'react';

export const SimpleAvatar = ({ src, fallback }) => (
  <div className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-blue-500/20">
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

