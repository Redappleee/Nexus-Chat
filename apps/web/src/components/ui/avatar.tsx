'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, getInitials } from '@/lib/utils';

export function Avatar({
  className,
  src,
  name,
  status,
  size = 'default',
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  src?: string;
  name?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  size?: 'sm' | 'default' | 'lg' | 'xl';
}) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    default: 'h-10 w-10 text-sm font-medium',
    lg: 'h-12 w-12 text-base font-medium',
    xl: 'h-16 w-16 text-lg font-semibold',
  };

  const statusDotSizes = {
    sm: 'h-2.5 w-2.5 right-0 bottom-0',
    default: 'h-3 w-3 right-0 bottom-0',
    lg: 'h-3.5 w-3.5 right-0.5 bottom-0.5',
    xl: 'h-4 w-4 right-1 bottom-1',
  };

  return (
    <div className="relative inline-flex shrink-0">
      <AvatarPrimitive.Root
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full border border-white/[0.08] bg-zinc-800 transition-opacity hover:opacity-90',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <AvatarPrimitive.Image
          src={src}
          alt={name || 'Avatar'}
          className="aspect-square h-full w-full object-cover"
        />
        <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-[#1e293b] font-medium text-zinc-200">
          {name ? getInitials(name) : '?'}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>

      {status && (
        <span className={cn('absolute flex items-center justify-center', statusDotSizes[size])}>
          <span
            className={cn(
              'h-full w-full rounded-full border-2 border-[#090c14]',
              status === 'online' && 'bg-emerald-500',
              status === 'away' && 'bg-amber-400',
              status === 'busy' && 'bg-rose-500',
              status === 'offline' && 'bg-zinc-500'
            )}
          />
        </span>
      )}
    </div>
  );
}
