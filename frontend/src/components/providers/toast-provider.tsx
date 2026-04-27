'use client';

import { XIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToastStore, type ToastItem } from '@/store/use-toast-store';

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismissToast = useToastStore((state) => state.dismissToast);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      dismissToast(toast.id);
    }, toast.durationMs ?? 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dismissToast, toast.durationMs, toast.id]);

  return (
    <div
      className={
        toast.tone === 'error'
          ? 'pointer-events-auto flex min-w-72 max-w-sm items-start gap-3 rounded-[1.4rem] border border-destructive/30 bg-background/96 px-4 py-3 text-foreground shadow-[0_24px_50px_rgba(46,25,18,0.18)] backdrop-blur-xl'
          : 'pointer-events-auto flex min-w-72 max-w-sm items-start gap-3 rounded-[1.4rem] border border-border bg-background/96 px-4 py-3 text-foreground shadow-[0_24px_50px_rgba(46,25,18,0.18)] backdrop-blur-xl'
      }
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {toast.description}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-full"
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss notification"
      >
        <XIcon />
      </Button>
    </div>
  );
}

export function ToastProvider() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-90 flex max-w-[calc(100vw-2rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
