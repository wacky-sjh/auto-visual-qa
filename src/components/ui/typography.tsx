import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const typographyVariants = cva('leading-normal', {
  variants: {
    variant: {
      // Heading variants
      h1: 'text-[48px] font-bold',
      h2: 'text-[40px] font-bold',
      h3: 'text-[32px] font-semibold',
      h4: 'text-[24px] font-bold',
      'h4-semibold': 'text-[24px] font-semibold',
      h5: 'text-[16px] font-bold',
      'h5-semibold': 'text-[16px] font-semibold',
      // Body variants
      body1: 'text-[24px] font-normal',
      body2: 'text-[20px] font-normal',
      body3: 'text-[16px] font-normal',
      body4: 'text-[14px] font-normal',
      body5: 'text-[12px] font-normal',
    },
  },
  defaultVariants: {
    variant: 'body3',
  },
});

type TypographyElement =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'li'
  | 'blockquote'
  | 'code'
  | 'small';

export interface TypographyProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: TypographyElement;
  asChild?: boolean;
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, as, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : as || getDefaultElement(variant);

    return (
      <Comp
        ref={ref as any}
        className={cn(typographyVariants({ variant, className }))}
        {...props}
      />
    );
  }
);

Typography.displayName = 'Typography';

// Helper function to determine default element based on variant
function getDefaultElement(
  variant?: TypographyProps['variant']
): TypographyElement {
  if (!variant) return 'p';

  // Map variants to HTML elements
  const variantToElement: Record<string, TypographyElement> = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    'h4-semibold': 'h4',
    h5: 'h5',
    'h5-semibold': 'h5',
    'body-xl': 'p',
    'body-l': 'p',
    'body-m': 'p',
    'body-s': 'p',
    'body-xs': 'p',
    lead: 'p',
    large: 'div',
    small: 'small',
    muted: 'p',
    code: 'code',
    blockquote: 'blockquote',
  };

  return variantToElement[variant] || 'p';
}

export { Typography, typographyVariants };
