import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
} as const;

interface LoadingSpinnerProps {
  size?: keyof typeof sizeClasses;
  /** Wrap the spinner in a centered flex container of this height. */
  containerClassName?: string;
}

export default function LoadingSpinner({ size = 'md', containerClassName }: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('animate-spin rounded-full border-b-2 border-brand-500', sizeClasses[size])} />
  );

  if (!containerClassName) return spinner;

  return (
    <div className={cn('flex items-center justify-center', containerClassName)}>{spinner}</div>
  );
}
