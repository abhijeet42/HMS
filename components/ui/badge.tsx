import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200/60',
    success: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200/70',
    warning: 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-200/70',
    danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70',
    outline: 'border border-gray-200 text-gray-700 bg-white',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }