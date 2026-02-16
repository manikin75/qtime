import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '../utils/cn.util';

interface TooltipProps {
  asChild?: boolean;
  children: React.ReactNode;
  content: React.ReactNode | string;
  className?: string;
  position?: TooltipPrimitive.TooltipContentProps['side'];
  align?: TooltipPrimitive.TooltipContentProps['align'];
  onOpenChange?: () => void;
  delayDuration?: number;
}

const TooltipProvider = TooltipPrimitive.Provider;

const WithTooltip = ({
  asChild = true,
  children,
  className,
  position = 'top',
  align = 'center',
  content,
  onOpenChange,
  delayDuration = 500,
}: TooltipProps) => {
  return (
    <TooltipPrimitive.Root
      delayDuration={delayDuration}
      disableHoverableContent
      onOpenChange={onOpenChange}
    >
      <TooltipPrimitive.Trigger asChild={asChild}>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        align={align}
        className={cn(
          'fade-in-0 zoom-in-95 bg-black/90 text-white! animate-in data-[state=delayed-open]:data-[side=bottom]:slide-in-from-top-2 data-[state=delayed-open]:data-[side=left]:slide-in-from-right-2 data-[state=delayed-open]:data-[side=right]:slide-in-from-left-2 data-[state=delayed-open]:data-[side=top]:slide-in-from-bottom-2 radius-normal z-50 max-w-90 overflow-hidden px-3 py-1.5 text-sm font-normal text-wrap normal-case will-change-[transform,opacity]',
          className,
        )}
        side={position}
      >
        {content}
        <TooltipPrimitive.Arrow width={11} height={5} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  );
};

export { TooltipProvider, WithTooltip };
