import React from 'react';

const TrendingUpIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l3.5 3.5L21.75 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6h4.5v4.5" />
    </svg>
);

export default TrendingUpIcon;