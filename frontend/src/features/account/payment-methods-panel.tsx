'use client';

import {
  AlertTriangleIcon,
  CreditCardIcon,
  PencilLineIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  WalletCardsIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  SavedPaymentMethod,
  UpsertSavedPaymentMethodInput,
} from '@/features/account/schemas';
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  setDefaultPaymentMethod,
  updatePaymentMethod,
} from '@/services/account';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';

const emptyPaymentMethodForm: UpsertSavedPaymentMethodInput = {
  type: 'CARD',
  label: '',
  cardholderName: '',
  cardLast4: '',
  cardExpiryMonth: '',
  cardExpiryYear: '',
};

function formatExpiryDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function splitExpiryDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return {
    cardExpiryMonth: digits.slice(0, 2),
    cardExpiryYear: digits.slice(2, 4),
  };
}

type PaymentMethodField = keyof UpsertSavedPaymentMethodInput;
type PaymentMethodFieldErrors = Partial<Record<PaymentMethodField, string>>;

export function PaymentMethodsPanel() {
  const t = useTranslations('account');
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [paymentMethodForm, setPaymentMethodForm] =
    useState<UpsertSavedPaymentMethodInput>(emptyPaymentMethodForm);
  const [cardExpiryDate, setCardExpiryDate] = useState('');
  const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<
    string | null
  >(null);
  const [paymentMethodFieldErrors, setPaymentMethodFieldErrors] =
    useState<PaymentMethodFieldErrors>({});
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(
    null,
  );
  const [isSavingPaymentMethod, setIsSavingPaymentMethod] = useState(false);
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] =
    useState(false);
  const [isSwitchingDefaultId, setIsSwitchingDefaultId] = useState<
    string | null
  >(null);
  const [isDeletingPaymentMethodId, setIsDeletingPaymentMethodId] = useState<
    string | null
  >(null);
  const [confirmDeletePaymentMethodId, setConfirmDeletePaymentMethodId] =
    useState<string | null>(null);

  useLockBodyScroll(isPaymentMethodDialogOpen);

  const loadPaymentMethods = async () => {
    setLoadError(false);
    setIsLoading(true);

    try {
      const response = await listPaymentMethods();
      setPaymentMethods(response.items);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    void listPaymentMethods()
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setPaymentMethods(response.items);
        setLoadError(false);
        setIsLoading(false);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setLoadError(true);
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const savedCardMethods = useMemo(
    () =>
      paymentMethods.filter((paymentMethod) => paymentMethod.type === 'CARD'),
    [paymentMethods],
  );

  const hasPaymentMethods = savedCardMethods.length > 0;
  const submitLabel = editingPaymentMethodId
    ? t('savePaymentMethod')
    : t('addPaymentMethod');

  const sortedPaymentMethods = useMemo(
    () =>
      [...savedCardMethods].sort((left, right) => {
        if (left.isDefault === right.isDefault) {
          return left.createdAt.localeCompare(right.createdAt);
        }

        return left.isDefault ? -1 : 1;
      }),
    [savedCardMethods],
  );

  const validatePaymentMethodForm = () => {
    const nextErrors: PaymentMethodFieldErrors = {};

    if (!paymentMethodForm.label.trim()) {
      nextErrors.label = 'errorPaymentMethodLabelRequired';
    }

    if (paymentMethodForm.type === 'CARD') {
      if (!paymentMethodForm.cardholderName?.trim()) {
        nextErrors.cardholderName = 'errorCardholderNameRequired';
      }
      if (!paymentMethodForm.cardLast4?.trim()) {
        nextErrors.cardLast4 = 'errorCardLast4Required';
      } else if (!/^\d{4}$/.test(paymentMethodForm.cardLast4.trim())) {
        nextErrors.cardLast4 = 'errorCardLast4Invalid';
      }
      if (!paymentMethodForm.cardExpiryMonth?.trim()) {
        nextErrors.cardExpiryMonth = 'errorCardExpiryRequired';
      } else if (
        !/^(0[1-9]|1[0-2])$/.test(paymentMethodForm.cardExpiryMonth.trim())
      ) {
        nextErrors.cardExpiryMonth = 'errorCardExpiryInvalid';
      } else if (!paymentMethodForm.cardExpiryYear?.trim()) {
        nextErrors.cardExpiryYear = 'errorCardExpiryRequired';
      } else if (!/^\d{2}$/.test(paymentMethodForm.cardExpiryYear.trim())) {
        nextErrors.cardExpiryYear = 'errorCardExpiryInvalid';
      }
    }

    return nextErrors;
  };

  const resetPaymentMethodForm = () => {
    setPaymentMethodForm(emptyPaymentMethodForm);
    setEditingPaymentMethodId(null);
    setPaymentMethodFieldErrors({});
    setPaymentMethodError(null);
    setCardExpiryDate('');
    setIsPaymentMethodDialogOpen(false);
  };

  const openCreatePaymentMethodDialog = () => {
    setEditingPaymentMethodId(null);
    setPaymentMethodForm(emptyPaymentMethodForm);
    setCardExpiryDate('');
    setPaymentMethodFieldErrors({});
    setPaymentMethodError(null);
    setIsPaymentMethodDialogOpen(true);
  };

  const handlePaymentMethodSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const nextErrors = validatePaymentMethodForm();
    setPaymentMethodFieldErrors(nextErrors);
    setPaymentMethodError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSavingPaymentMethod(true);

    try {
      const savedPaymentMethod = editingPaymentMethodId
        ? await updatePaymentMethod(editingPaymentMethodId, paymentMethodForm)
        : await createPaymentMethod(paymentMethodForm);

      setPaymentMethods((current) => {
        const withoutSaved = current.filter(
          (paymentMethod) => paymentMethod.id !== savedPaymentMethod.id,
        );
        return [...withoutSaved, savedPaymentMethod];
      });
      resetPaymentMethodForm();
    } catch {
      setPaymentMethodError('errorPaymentMethodSaveFailed');
    } finally {
      setIsSavingPaymentMethod(false);
    }
  };

  const beginEditPaymentMethod = (paymentMethod: SavedPaymentMethod) => {
    setEditingPaymentMethodId(paymentMethod.id);
    setPaymentMethodFieldErrors({});
    setPaymentMethodError(null);
    setIsPaymentMethodDialogOpen(true);
    setPaymentMethodForm({
      type: paymentMethod.type,
      label: paymentMethod.label,
      cardholderName: paymentMethod.cardholderName ?? '',
      cardLast4: paymentMethod.cardLast4 ?? '',
      cardExpiryMonth: paymentMethod.cardExpiryMonth ?? '',
      cardExpiryYear: paymentMethod.cardExpiryYear ?? '',
      bankName: paymentMethod.bankName ?? '',
    });
    setCardExpiryDate(
      paymentMethod.cardExpiryMonth && paymentMethod.cardExpiryYear
        ? `${paymentMethod.cardExpiryMonth}/${paymentMethod.cardExpiryYear}`
        : '',
    );
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    setIsSwitchingDefaultId(paymentMethodId);
    setPaymentMethodError(null);

    try {
      const updatedPaymentMethod =
        await setDefaultPaymentMethod(paymentMethodId);
      setPaymentMethods((current) =>
        current.map((paymentMethod) =>
          paymentMethod.id === updatedPaymentMethod.id
            ? updatedPaymentMethod
            : { ...paymentMethod, isDefault: false },
        ),
      );
    } catch {
      setPaymentMethodError('errorPaymentMethodDefaultFailed');
    } finally {
      setIsSwitchingDefaultId(null);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    setIsDeletingPaymentMethodId(paymentMethodId);
    setPaymentMethodError(null);

    try {
      await deletePaymentMethod(paymentMethodId);
      const nextPaymentMethods = paymentMethods.filter(
        (paymentMethod) => paymentMethod.id !== paymentMethodId,
      );
      setPaymentMethods(nextPaymentMethods);

      if (editingPaymentMethodId === paymentMethodId) {
        resetPaymentMethodForm();
      }

      const defaultPaymentMethod = nextPaymentMethods.find(
        (paymentMethod) => paymentMethod.isDefault,
      );
      if (!defaultPaymentMethod && nextPaymentMethods.length > 0) {
        const refreshed = await listPaymentMethods();
        setPaymentMethods(refreshed.items);
      }
    } catch {
      setPaymentMethodError('errorPaymentMethodDeleteFailed');
    } finally {
      setIsDeletingPaymentMethodId(null);
      setConfirmDeletePaymentMethodId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="flex-1 border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
        <CardContent className="py-8 text-sm text-muted-foreground">
          {t('loading')}
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="flex-1 border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
        <CardHeader>
          <CardTitle>{t('paymentMethodsLoadFailed')}</CardTitle>
          <CardDescription>
            {t('paymentMethodsLoadFailedDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => void loadPaymentMethods()}>
            {t('retryLoad')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex-1 border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full border border-border bg-[#2a1d18] text-foreground">
                <WalletCardsIcon />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle>{t('paymentMethodsTitle')}</CardTitle>
                <CardDescription>
                  {t('paymentMethodsDescription')}
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              className="w-full justify-center sm:w-auto"
              onClick={openCreatePaymentMethodDialog}
            >
              <PlusIcon data-icon="inline-start" />
              {t('addPaymentMethod')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!hasPaymentMethods ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm leading-7 text-muted-foreground">
              {t('paymentMethodsEmpty')}
            </div>
          ) : null}

          {paymentMethodError && !isPaymentMethodDialogOpen ? (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangleIcon className="mt-0.5 shrink-0" />
              <p>{t(paymentMethodError)}</p>
            </div>
          ) : null}

          {sortedPaymentMethods.map((paymentMethod) => (
            <div
              key={paymentMethod.id}
              className="rounded-2xl border border-border bg-background/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {paymentMethod.label}
                    </p>
                    <Badge variant="outline">
                      {t(`paymentMethodKind.${paymentMethod.type}`)}
                    </Badge>
                    {paymentMethod.isDefault ? (
                      <Badge
                        variant="secondary"
                        className="bg-[#3a2922] text-foreground"
                      >
                        {t('defaultBadge')}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-sm leading-7 text-muted-foreground">
                    {paymentMethod.type === 'CARD' ? (
                      <>
                        <p>{paymentMethod.cardholderName}</p>
                        <p>
                          {t('endingInLabel', {
                            last4: paymentMethod.cardLast4 ?? '0000',
                          })}
                        </p>
                        <p>
                          {t('expiresLabel', {
                            month: paymentMethod.cardExpiryMonth ?? '--',
                            year: paymentMethod.cardExpiryYear ?? '--',
                          })}
                        </p>
                      </>
                    ) : (
                      <p>
                        {t('bankNameLabel')}: {paymentMethod.bankName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!paymentMethod.isDefault ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSwitchingDefaultId === paymentMethod.id}
                      onClick={() =>
                        handleSetDefaultPaymentMethod(paymentMethod.id)
                      }
                    >
                      {isSwitchingDefaultId === paymentMethod.id
                        ? t('settingDefault')
                        : t('setDefault')}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-sky-500/30 text-sky-700 hover:bg-sky-500/10 hover:text-sky-800 dark:text-sky-200"
                    onClick={() => beginEditPaymentMethod(paymentMethod)}
                  >
                    <PencilLineIcon data-icon="inline-start" />
                    {t('editPaymentMethod')}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isDeletingPaymentMethodId === paymentMethod.id}
                    onClick={() =>
                      setConfirmDeletePaymentMethodId(paymentMethod.id)
                    }
                  >
                    <Trash2Icon data-icon="inline-start" />
                    {isDeletingPaymentMethodId === paymentMethod.id
                      ? t('deletingPaymentMethod')
                      : t('deletePaymentMethod')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <p className="text-sm leading-7 text-muted-foreground">
            {t('paymentMethodsCheckoutNote')}
          </p>
        </CardFooter>
      </Card>

      {isPaymentMethodDialogOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-90 flex items-center justify-center bg-[rgba(28,18,14,0.52)] px-4 py-6 backdrop-blur-sm sm:px-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-method-dialog-title"
            >
              <Card className="flex max-h-[calc(100dvh-8rem)] w-full max-w-2xl flex-col border-border/90 bg-background/98 py-0 shadow-[0_30px_90px_rgba(28,18,14,0.28)] sm:max-h-[calc(100dvh-3rem)]">
                <CardHeader className="gap-3 border-b border-border/80 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <CardTitle id="payment-method-dialog-title">
                        {editingPaymentMethodId
                          ? t('editPaymentMethodTitle')
                          : t('addPaymentMethodTitle')}
                      </CardTitle>
                      <CardDescription>
                        {t('paymentMethodFormDescription')}
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={resetPaymentMethodForm}
                      aria-label={t('cancelEditing')}
                    >
                      <XIcon />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 overflow-y-auto py-4">
                  <form
                    id="payment-method-dialog-form"
                    className="flex flex-col gap-4"
                    onSubmit={handlePaymentMethodSubmit}
                  >
                    <div className="rounded-2xl border border-border bg-background/70 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCardIcon className="size-4" />
                        <p className="text-sm font-medium text-foreground">
                          {t('paymentMethodKind.CARD')}
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {t('savedCardsOnlyNote')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="payment-method-label">
                        {t('paymentMethodLabel')}
                      </Label>
                      <Input
                        id="payment-method-label"
                        aria-invalid={Boolean(paymentMethodFieldErrors.label)}
                        value={paymentMethodForm.label}
                        onChange={(event) =>
                          setPaymentMethodForm((current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                      />
                      {paymentMethodFieldErrors.label ? (
                        <p className="text-sm text-destructive">
                          {t(paymentMethodFieldErrors.label)}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cardholder-name">
                        {t('cardholderName')}
                      </Label>
                      <Input
                        id="cardholder-name"
                        aria-invalid={Boolean(
                          paymentMethodFieldErrors.cardholderName,
                        )}
                        value={paymentMethodForm.cardholderName ?? ''}
                        onChange={(event) =>
                          setPaymentMethodForm((current) => ({
                            ...current,
                            cardholderName: event.target.value,
                          }))
                        }
                      />
                      {paymentMethodFieldErrors.cardholderName ? (
                        <p className="text-sm text-destructive">
                          {t(paymentMethodFieldErrors.cardholderName)}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="card-last4">{t('cardLast4')}</Label>
                        <Input
                          id="card-last4"
                          inputMode="numeric"
                          maxLength={4}
                          aria-invalid={Boolean(
                            paymentMethodFieldErrors.cardLast4,
                          )}
                          value={paymentMethodForm.cardLast4 ?? ''}
                          onChange={(event) =>
                            setPaymentMethodForm((current) => ({
                              ...current,
                              cardLast4: event.target.value
                                .replace(/\D/g, '')
                                .slice(0, 4),
                            }))
                          }
                        />
                        {paymentMethodFieldErrors.cardLast4 ? (
                          <p className="text-sm text-destructive">
                            {t(paymentMethodFieldErrors.cardLast4)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="card-expiry-date">
                          {t('cardExpiryDate')}
                        </Label>
                        <Input
                          id="card-expiry-date"
                          inputMode="numeric"
                          maxLength={5}
                          aria-invalid={Boolean(
                            paymentMethodFieldErrors.cardExpiryMonth ||
                            paymentMethodFieldErrors.cardExpiryYear,
                          )}
                          placeholder="MM/YY"
                          value={cardExpiryDate}
                          onChange={(event) => {
                            const formatted = formatExpiryDateInput(
                              event.target.value,
                            );
                            const nextExpiry = splitExpiryDate(formatted);
                            setCardExpiryDate(formatted);
                            setPaymentMethodForm((current) => ({
                              ...current,
                              ...nextExpiry,
                            }));
                          }}
                        />
                        {paymentMethodFieldErrors.cardExpiryMonth ||
                        paymentMethodFieldErrors.cardExpiryYear ? (
                          <p className="text-sm text-destructive">
                            {t(
                              paymentMethodFieldErrors.cardExpiryMonth ??
                                paymentMethodFieldErrors.cardExpiryYear!,
                            )}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {paymentMethodError ? (
                      <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        <AlertTriangleIcon className="mt-0.5 shrink-0" />
                        <p>{t(paymentMethodError)}</p>
                      </div>
                    ) : null}
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 border-t border-border/80 bg-background/96 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={resetPaymentMethodForm}
                  >
                    {t('cancelEditing')}
                  </Button>
                  <Button
                    type="submit"
                    form="payment-method-dialog-form"
                    className="w-full sm:w-auto"
                    disabled={isSavingPaymentMethod}
                  >
                    <SaveIcon data-icon="inline-start" />
                    {isSavingPaymentMethod
                      ? t('savingPaymentMethod')
                      : submitLabel}
                  </Button>
                </CardFooter>
              </Card>
            </div>,
            document.body,
          )
        : null}

      <ConfirmDialog
        open={Boolean(confirmDeletePaymentMethodId)}
        title={t('confirmDeletePaymentMethodTitle')}
        description={t('confirmDeletePaymentMethodDescription')}
        confirmLabel={t('confirmDeletePaymentMethod')}
        cancelLabel={t('cancelConfirm')}
        destructive
        isPending={Boolean(
          confirmDeletePaymentMethodId && isDeletingPaymentMethodId,
        )}
        onClose={() => {
          if (!isDeletingPaymentMethodId) {
            setConfirmDeletePaymentMethodId(null);
          }
        }}
        onConfirm={async () => {
          if (!confirmDeletePaymentMethodId) {
            return;
          }

          await handleDeletePaymentMethod(confirmDeletePaymentMethodId);
        }}
      />
    </>
  );
}
