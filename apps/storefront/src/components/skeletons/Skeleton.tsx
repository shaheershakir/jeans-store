import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular' | 'pill'
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

/**
 * Apple-grade responsive skeleton primitive with GPU-accelerated shimmer.
 * Adheres to fluid design principles, strict sizing, and reduced-motion preferences.
 */
export default function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const variantClass =
    variant === 'circular'
      ? 'skeleton-circle'
      : variant === 'pill'
        ? 'skeleton-pill'
        : variant === 'text'
          ? 'skeleton-text'
          : ''

  const combinedStyles: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style
  }

  return (
    <div
      className={`apple-skeleton-pulse ${variantClass} ${className}`.trim()}
      style={combinedStyles}
      aria-hidden="true"
      {...props}
    />
  )
}
