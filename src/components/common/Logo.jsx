import React from 'react';

export default function Logo({ className = "h-10 sm:h-11 lg:h-12", showText = true, isDark = false }) {
  if (!showText) {
    return (
      <div className={`inline-flex items-center select-none cursor-pointer group ${className}`}>
        <img
          src="/logo-icon.png"
          alt="Software Solutions BD"
          className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none cursor-pointer group ${className}`}>
      <img
        src={isDark ? "/logo-white.png" : "/logo.png"}
        alt="Software Solutions BD - Your Trusted Digital Partner"
        className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/photo_2026-10-20_11-19-54.jpg";
        }}
      />
    </div>
  );
}
