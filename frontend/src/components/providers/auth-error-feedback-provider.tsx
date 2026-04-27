'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { classifyAuthError } from '@/features/auth/classify-auth-error';
import { getAuthActionMessageKey } from '@/features/auth/auth-error-messages';
import { useAuthStore } from '@/store/use-auth-store';
import { useToastStore } from '@/store/use-toast-store';

export function AuthErrorFeedbackProvider() {
  const t = useTranslations('auth');
  const error = useAuthStore((state) => state.error);
  const errorSource = useAuthStore((state) => state.errorSource);
  const pushToast = useToastStore((state) => state.pushToast);
  const lastErrorRef = useRef<unknown>(null);

  useEffect(() => {
    if (!error || !errorSource || lastErrorRef.current === error) {
      return;
    }

    lastErrorRef.current = error;

    const classification = classifyAuthError(error, errorSource);

    if (classification.ui !== 'inline+toast') {
      return;
    }

    pushToast({
      title: t('unexpectedErrorTitle'),
      description: t(getAuthActionMessageKey(errorSource, error.code)),
      tone: 'error',
    });
  }, [error, errorSource, pushToast, t]);

  return null;
}
