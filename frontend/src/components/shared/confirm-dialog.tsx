'use client';

import { AlertTriangleIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  isPending?: boolean;
  destructive?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  isPending = false,
  destructive = false,
}: ConfirmDialogProps) {
  useLockBodyScroll(open);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(35,22,17,0.48)] px-4 py-4 backdrop-blur-[2px] sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md border-border/80 bg-card/98 shadow-[0_24px_70px_rgba(35,22,17,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-11 items-center justify-center rounded-full border ${
                destructive
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-border bg-muted text-foreground'
              }`}
            >
              <AlertTriangleIcon />
            </div>
            <CardTitle id="confirm-dialog-title">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center sm:w-auto"
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            className="w-full justify-center sm:w-auto"
            disabled={isPending}
            onClick={() => {
              void onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>,
    document.body,
  );
}
