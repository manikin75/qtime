import type { ComponentProps, HTMLAttributes } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import { cn } from '../utils/cn.util';
import { XIcon } from '@phosphor-icons/react';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = ({
  blurredOverlay = false,
  className,
  ...restProps
}: ComponentProps<typeof DialogPrimitive.Overlay> & {
  blurredOverlay?: boolean;
}) => (
  <DialogPrimitive.Overlay
    className={cn(
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 duration-200 data-[blurred-overlay=true]:backdrop-blur-xs',
      className,
    )}
    data-blurred-overlay={blurredOverlay}
    {...restProps}
  />
);

const DialogContent = ({
  children,
  className,
  ...restProps
}: ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPortal>
    <DialogOverlay />
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className={cn(
          'p-dialog bg-dialog data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-default relative z-50 w-full max-w-lg gap-4 border shadow-lg duration-200',
          className,
        )}
        {...restProps}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-5 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </div>
  </DialogPortal>
);

const DialogContentGhost = ({
  className,
  children,
  ...restProps
}: ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPortal>
    <DialogOverlay blurredOverlay />
    <DialogPrimitive.Content
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[40%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] gap-4 bg-none shadow-lg duration-200 sm:rounded-(--radius-defualt)',
        className,
      )}
      {...restProps}
    >
      <VisuallyHidden>
        <DialogTitle />
        <DialogDescription />
      </VisuallyHidden>
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
);

const DialogContentClean = ({
  children,
  className,
  ...restProps
}: ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPortal>
    <DialogPrimitive.Content
      className={cn(
        `data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[40%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] gap-4 bg-none shadow-lg duration-200 sm:rounded-(--radius-default)`,
        className,
      )}
      {...restProps}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
);

const ScrollableDialog = ({
  children,
  className,
  ...restProps
}: ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed top-0 right-0 bottom-0 left-0 z-10 grid place-items-center overflow-y-auto bg-black/80">
      <DialogPrimitive.Content
        className={cn(
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] relative shadow-lg duration-200 sm:rounded-lg',
          className,
        )}
        {...restProps}
      >
        {children}
        <DialogClose className="absolute top-3 right-3">
          <XIcon />
        </DialogClose>
      </DialogPrimitive.Content>
    </DialogPrimitive.Overlay>
  </DialogPrimitive.Portal>
);

const DialogHeader = ({
  className,
  ...restProps
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'pb-dialog-header-bottom border-q-brown flex flex-col border-b px-0 text-left',
      className,
    )}
    {...restProps}
  />
);

const DialogFooter = ({
  className,
  ...restProps
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'p-dialog-bottom pb-dialog-footer-bottom pt-dialog-footer-top flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...restProps}
  />
);

const DialogTitle = ({
  className,
  ...restProps
}: ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn(className, 'q-font-h4 tracking-tight not-first:leading-none')}
    {...restProps}
  />
);

const DialogDescription = ({
  className,
  ...restProps
}: ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    className={cn('text-muted-foreground q-font-small text-sm', className)}
    {...restProps}
  />
);

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogContentGhost,
  DialogContentClean,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  ScrollableDialog,
};
