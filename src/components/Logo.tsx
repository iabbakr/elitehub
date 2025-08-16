

import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      width="110"
      height="24"
      viewBox="0 0 162 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text x="0" y="27" fontFamily="Inter, Arial, sans-serif" fontSize="30" fontWeight="bold" letterSpacing="0.02em">
        <tspan fill="#2A2F64">ELI</tspan>
        <tspan fill="#2A2F64">TE</tspan>
        <tspan fill="#F44336">HUB</tspan>
      </text>
      <rect x="42" y="5" width="6" height="6" fill="#F44336"/>
    </svg>
  );
}
