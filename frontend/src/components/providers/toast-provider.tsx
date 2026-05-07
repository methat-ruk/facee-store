'use client';

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  XCircleIcon,
  XIcon,
} from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToastStore, type ToastItem } from '@/store/use-toast-store';

const toastToneStyles = {
  success: {
    container:
      'border-emerald-500/28 bg-[linear-gradient(180deg,rgba(21,33,27,0.96)_0%,rgba(15,24,20,0.98)_100%)] text-emerald-50 shadow-[0_24px_50px_rgba(8,39,24,0.32)]',
    iconWrap: 'bg-emerald-500/16 text-emerald-300 ring-1 ring-emerald-400/24',
    icon: CheckCircle2Icon,
    closeButton:
      'text-emerald-100/80 hover:bg-emerald-500/12 hover:text-emerald-50',
  },
  error: {
    container:
      'border-rose-500/30 bg-[linear-gradient(180deg,rgba(47,19,21,0.96)_0%,rgba(31,14,15,0.98)_100%)] text-rose-50 shadow-[0_24px_50px_rgba(59,13,20,0.34)]',
    iconWrap: 'bg-rose-500/16 text-rose-300 ring-1 ring-rose-400/24',
    icon: XCircleIcon,
    closeButton: 'text-rose-100/80 hover:bg-rose-500/12 hover:text-rose-50',
  },
  warning: {
    container:
      'border-amber-500/30 bg-[linear-gradient(180deg,rgba(47,33,18,0.96)_0%,rgba(31,22,12,0.98)_100%)] text-amber-50 shadow-[0_24px_50px_rgba(64,39,7,0.34)]',
    iconWrap: 'bg-amber-500/16 text-amber-300 ring-1 ring-amber-400/24',
    icon: AlertTriangleIcon,
    closeButton: 'text-amber-100/80 hover:bg-amber-500/12 hover:text-amber-50',
  },
  info: {
    container:
      'border-sky-500/26 bg-[linear-gradient(180deg,rgba(18,31,43,0.96)_0%,rgba(12,22,31,0.98)_100%)] text-sky-50 shadow-[0_24px_50px_rgba(10,28,48,0.34)]',
    iconWrap: 'bg-sky-500/16 text-sky-300 ring-1 ring-sky-400/24',
    icon: InfoIcon,
    closeButton: 'text-sky-100/80 hover:bg-sky-500/12 hover:text-sky-50',
  },
} as const;

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismissToast = useToastStore((state) => state.dismissToast);
  const toneStyle = toastToneStyles[toast.tone];
  const Icon = toneStyle.icon;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      dismissToast(toast.id);
    }, toast.durationMs ?? 3500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dismissToast, toast.durationMs, toast.id]);

  return (
    <div
      className={`pointer-events-auto flex min-w-72 max-w-sm items-start gap-3 rounded-[1.4rem] border px-4 py-3 shadow-[0_24px_50px_rgba(46,25,18,0.18)] backdrop-blur-xl ${toneStyle.container}`}
    >
      <div
        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ${toneStyle.iconWrap}`}
      >
        <Icon className="size-[1.15rem]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        <p className="mt-1 text-sm leading-6 text-current/78">
          {toast.description}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`size-8 shrink-0 rounded-full ${toneStyle.closeButton}`}
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss notification"
      >
        <XIcon className="size-4.5" />
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
