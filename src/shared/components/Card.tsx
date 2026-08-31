import React from 'react';
import { cn } from '../utils/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  key?: React.Key;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("bg-white rounded-2xl p-4 shadow-sm border border-gray-100", className)} {...props}>
      {children}
    </div>
  );
}
