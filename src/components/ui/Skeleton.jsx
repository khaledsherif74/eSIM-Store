import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ variant = 'text', className = '', style = {} }) => {
  const skeletonClass = `skeleton skeleton-${variant} ${className}`;
  return <div className={skeletonClass} style={style} />;
};

export const SkeletonText = ({ lines = 1, className = '', style = {} }) => (
  <div className={`skeleton-text-container ${className}`} style={style}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" />
    ))}
  </div>
);

export const SkeletonCard = ({ children, className = '', style = {} }) => (
  <div className={`skeleton-card ${className}`} style={style}>
    {children || (
      <>
        <Skeleton variant="image" />
        <Skeleton variant="title" />
        <Skeleton variant="text" lines={2} />
      </>
    )}
  </div>
);

export const SkeletonCircle = ({ size = 40, className = '', style = {} }) => (
  <Skeleton
    variant="circle"
    className={className}
    style={{ ...style, width: size, height: size }}
  />
);
