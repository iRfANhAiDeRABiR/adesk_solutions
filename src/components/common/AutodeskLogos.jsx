import React from 'react';

/**
 * Modern AutoCAD Logo Badge (Official Red Squircle with Faceted Origami 'A')
 */
export function AutoCadLogo({ className = "w-10 h-10" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="acad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF1E46" />
          <stop offset="60%" stopColor="#E5103B" />
          <stop offset="100%" stopColor="#B30526" />
        </linearGradient>
        <linearGradient id="acad-facet-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F2F5" />
        </linearGradient>
        <linearGradient id="acad-facet-mid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E6EA" />
          <stop offset="100%" stopColor="#CBD1D7" />
        </linearGradient>
        <linearGradient id="acad-facet-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A8B0B8" />
          <stop offset="100%" stopColor="#8A949E" />
        </linearGradient>
        <filter id="acad-shadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Rounded Squircle Container */}
      <rect width="64" height="64" rx="16" fill="url(#acad-bg)" />
      
      {/* Subtle Inner Highlight */}
      <rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="14.5"
        stroke="white"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />

      {/* Modern 3D Faceted Ribbon "A" Symbol */}
      <g filter="url(#acad-shadow)" transform="translate(1, 0)">
        {/* Left Primary Pillar */}
        <path
          d="M31 12L15 48h8.5l3.5-8.5h11l1.5-4h-9.5l4.5-12.5L31 12z"
          fill="url(#acad-facet-light)"
        />
        {/* Right Slanted Leg / Fold */}
        <path
          d="M31 12l3.5 11 9 25H48L34.5 12H31z"
          fill="url(#acad-facet-mid)"
        />
        {/* Central Cross Facet / Dimension */}
        <path
          d="M27 39.5h11l-2.5 8.5H23.5l3.5-8.5z"
          fill="url(#acad-facet-dark)"
        />
        {/* Upper Facet Highlight */}
        <polygon
          points="31,12 34.5,23 29,23"
          fill="#FFFFFF"
          fillOpacity="0.9"
        />
      </g>
    </svg>
  );
}

/**
 * Modern Autodesk Corporate Wordmark & Continuous Geometric Ribbon Logo
 */
export function AutodeskLogo({ className = "h-5 w-auto", textColor = "currentColor" }) {
  return (
    <svg
      viewBox="0 0 170 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="adsk-ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0696D7" />
          <stop offset="50%" stopColor="#006499" />
          <stop offset="100%" stopColor="#00466B" />
        </linearGradient>
      </defs>

      {/* Modern Autodesk Geometric Ribbon Mark (2021+) */}
      <g transform="translate(0, 2)">
        {/* Facet 1 */}
        <path
          d="M14 2L2 26h6.5l3-6.5h7.5L22 26h7L18.5 2H14zM13 14l2.5-6 2.5 6h-5z"
          fill="#0696D7"
        />
        {/* Modern 3D loop accent */}
        <path
          d="M20 2L16 11l4 8h5.5l-4.5-9L25.5 2H20z"
          fill="#005A87"
        />
      </g>

      {/* Official Autodesk Wordmark Typography */}
      <text
        x="36"
        y="22"
        fill={textColor}
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="17"
        fontWeight="800"
        letterSpacing="2.5px"
      >
        AUTODESK
      </text>
    </svg>
  );
}

/**
 * Unified Autodesk Brand Header Badge for Product Showcase & Order Section
 */
export function AutodeskBrandBadge({ className = "" }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-50 via-red-50/20 to-slate-50 border border-slate-200/90 shadow-xs ${className}`}>
      <AutoCadLogo className="w-10 h-10 flex-shrink-0 drop-shadow-sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <AutodeskLogo className="h-4 w-auto text-slate-900" />
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-100 text-red-700 tracking-wider">
            AutoCAD Suite
          </span>
        </div>
        <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
          AutoCAD &bull; Revit &bull; 3ds Max &bull; Maya &bull; 47+ Official Apps
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Official</span>
      </div>
    </div>
  );
}

export default AutodeskBrandBadge;

