'use client';

import { Button, type ButtonProps } from '@heroui/react';

import { cn } from '@/lib/utils';

type CTAButtonProps = ButtonProps & {
  tone?: 'primary' | 'secondary';
};

const toneStyles = {
  primary:
    'bg-[#c61c2f] text-white shadow-lg shadow-red-200/70 hover:bg-[#a71726]',
  secondary:
    'border border-[#002e6b]/20 bg-white text-[#002e6b] hover:bg-[#002e6b]/5',
};

export function CTAButton({
  tone = 'primary',
  className,
  radius = 'full',
  ...props
}: CTAButtonProps) {
  return (
    <Button
      {...props}
      radius={radius}
      className={cn(
        'font-semibold uppercase tracking-wide',
        toneStyles[tone],
        className,
      )}
    />
  );
}
