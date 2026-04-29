'use client';

import {
  AlertTriangleIcon,
  MapPinIcon,
  PencilLineIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  UserRoundIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildAuthNoticeHref } from '@/features/auth/auth-routing';
import type { Address, UpsertAddressInput } from '@/features/account/schemas';
import { normalizePhoneInput } from '@/features/checkout/checkout-ui';
import { Link, useRouter } from '@/i18n/navigation';
import { isApiError } from '@/services/api-error';
import {
  createAddress,
  deleteAddress,
  getAccountProfile,
  listAddresses,
  setDefaultAddress,
  updateAccountProfile,
  updateAddress,
} from '@/services/account';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';
import { useAuthStore } from '@/store/use-auth-store';

const emptyAddressForm: UpsertAddressInput = {
  label: '',
  recipientFullName: '',
  recipientEmail: '',
  recipientPhone: '',
  addressLine: '',
  city: '',
  postalCode: '',
};

type AddressField = keyof UpsertAddressInput;
type AddressFieldErrors = Partial<Record<AddressField, string>>;

export function ProfilePage() {
  const t = useTranslations('account');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [profileForm, setProfileForm] = useState(() => ({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
  }));
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [addressForm, setAddressForm] =
    useState<UpsertAddressInput>(emptyAddressForm);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressFieldErrors, setAddressFieldErrors] =
    useState<AddressFieldErrors>({});
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isSwitchingDefaultId, setIsSwitchingDefaultId] = useState<
    string | null
  >(null);
  const [isDeletingAddressId, setIsDeletingAddressId] = useState<string | null>(
    null,
  );
  const [confirmDeleteAddressId, setConfirmDeleteAddressId] = useState<
    string | null
  >(null);

  useLockBodyScroll(isAddressDialogOpen);

  useEffect(() => {
    if (!isAuthInitialized || user) {
      return;
    }

    router.replace(buildAuthNoticeHref('/login', 'auth-required', '/profile'));
  }, [isAuthInitialized, router, user]);

  const loadAccountData = async () => {
    setLoadError(false);
    setIsLoading(true);

    try {
      const [profile, addressList] = await Promise.all([
        getAccountProfile(),
        listAddresses(),
      ]);

      setProfileForm({
        fullName: profile.fullName,
        email: profile.email,
      });
      setAddresses(addressList.items);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    void Promise.all([getAccountProfile(), listAddresses()])
      .then(([profile, addressList]) => {
        if (isCancelled) {
          return;
        }

        setProfileForm({
          fullName: profile.fullName,
          email: profile.email,
        });
        setAddresses(addressList.items);
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
  }, [user]);

  const hasAddresses = addresses.length > 0;
  const submitLabel = editingAddressId ? t('saveAddress') : t('addAddress');

  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((left, right) => {
        if (left.isDefault === right.isDefault) {
          return left.createdAt.localeCompare(right.createdAt);
        }

        return left.isDefault ? -1 : 1;
      }),
    [addresses],
  );

  const validateAddressForm = () => {
    const nextErrors: AddressFieldErrors = {};

    if (!addressForm.label.trim())
      nextErrors.label = 'errorAddressLabelRequired';
    if (!addressForm.recipientFullName.trim()) {
      nextErrors.recipientFullName = 'errorRecipientNameRequired';
    }
    if (!addressForm.recipientEmail.trim()) {
      nextErrors.recipientEmail = 'errorRecipientEmailRequired';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressForm.recipientEmail.trim())
    ) {
      nextErrors.recipientEmail = 'errorRecipientEmailInvalid';
    }
    if (!addressForm.recipientPhone.trim()) {
      nextErrors.recipientPhone = 'errorRecipientPhoneRequired';
    } else if (!/^\d{1,10}$/.test(addressForm.recipientPhone.trim())) {
      nextErrors.recipientPhone = 'errorRecipientPhoneInvalid';
    }
    if (!addressForm.addressLine.trim()) {
      nextErrors.addressLine = 'errorAddressLineRequired';
    }
    if (!addressForm.city.trim()) nextErrors.city = 'errorCityRequired';
    if (!addressForm.postalCode.trim()) {
      nextErrors.postalCode = 'errorPostalCodeRequired';
    }

    return nextErrors;
  };

  const resetAddressForm = () => {
    setAddressForm(emptyAddressForm);
    setEditingAddressId(null);
    setAddressFieldErrors({});
    setAddressError(null);
    setIsAddressDialogOpen(false);
  };

  const openCreateAddressDialog = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm);
    setAddressFieldErrors({});
    setAddressError(null);
    setIsAddressDialogOpen(true);
  };

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);

    try {
      await updateAccountProfile(profileForm);
      await refreshProfile();
      setProfileError('profileSaved');
    } catch (error) {
      if (isApiError(error) && error.code === 'AUTH_EMAIL_ALREADY_EXISTS') {
        setProfileError('errorEmailExists');
      } else {
        setProfileError('errorProfileSaveFailed');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddressSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const nextErrors = validateAddressForm();
    setAddressFieldErrors(nextErrors);
    setAddressError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSavingAddress(true);

    try {
      const savedAddress = editingAddressId
        ? await updateAddress(editingAddressId, addressForm)
        : await createAddress(addressForm);

      setAddresses((current) => {
        const withoutSaved = current.filter(
          (address) => address.id !== savedAddress.id,
        );
        return [...withoutSaved, savedAddress];
      });
      resetAddressForm();
    } catch (error) {
      if (isApiError(error)) {
        setAddressError(
          error.code === 'AUTH_EMAIL_ALREADY_EXISTS'
            ? 'errorEmailExists'
            : 'errorAddressSaveFailed',
        );
      } else {
        setAddressError('errorAddressSaveFailed');
      }
    } finally {
      setIsSavingAddress(false);
    }
  };

  const beginEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setAddressFieldErrors({});
    setAddressError(null);
    setIsAddressDialogOpen(true);
    setAddressForm({
      label: address.label,
      recipientFullName: address.recipientFullName,
      recipientEmail: address.recipientEmail,
      recipientPhone: address.recipientPhone,
      addressLine: address.addressLine,
      city: address.city,
      postalCode: address.postalCode,
    });
  };

  const handleSetDefault = async (addressId: string) => {
    setIsSwitchingDefaultId(addressId);
    setAddressError(null);

    try {
      const updatedAddress = await setDefaultAddress(addressId);
      setAddresses((current) =>
        current.map((address) =>
          address.id === updatedAddress.id
            ? updatedAddress
            : { ...address, isDefault: false },
        ),
      );
    } catch {
      setAddressError('errorAddressDefaultFailed');
    } finally {
      setIsSwitchingDefaultId(null);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setIsDeletingAddressId(addressId);
    setAddressError(null);

    try {
      await deleteAddress(addressId);
      const nextAddresses = addresses.filter(
        (address) => address.id !== addressId,
      );
      setAddresses(nextAddresses);

      if (editingAddressId === addressId) {
        resetAddressForm();
      }

      const defaultAddress = nextAddresses.find((address) => address.isDefault);
      if (!defaultAddress && nextAddresses.length > 0) {
        const refreshed = await listAddresses();
        setAddresses(refreshed.items);
      }
    } catch {
      setAddressError('errorAddressDeleteFailed');
    } finally {
      setIsDeletingAddressId(null);
      setConfirmDeleteAddressId(null);
    }
  };

  if (!isAuthInitialized || isRestoringProfile || isLoading) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-muted-foreground">
          {t('loading')}
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mx-auto w-full max-w-2xl border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
          <CardHeader className="text-center">
            <CardTitle>{t('loadFailed')}</CardTitle>
            <CardDescription>{t('loadFailedDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => void loadAccountData()}>
              {t('retryLoad')}
            </Button>
            <Button asChild variant="outline">
              <Link href="/orders">{t('viewOrders')}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className="flex flex-col gap-3">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t('eyebrow')}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t('title')}
        </h1>
        <p className="max-w-3xl text-base leading-8 text-muted-foreground">
          {t('description')}
        </p>
      </section>

      <Tabs defaultValue="account" className="flex-1 gap-6">
        <TabsList variant="line" className="w-full justify-start overflow-auto">
          <TabsTrigger value="account">{t('accountTab')}</TabsTrigger>
          <TabsTrigger value="addresses">{t('addressesTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="flex flex-1 flex-col">
          <Card className="flex-1 border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full border border-border bg-muted text-foreground">
                  <UserRoundIcon />
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle>{t('accountTitle')}</CardTitle>
                  <CardDescription>{t('accountDescription')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-5 sm:grid-cols-2"
                onSubmit={handleProfileSave}
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="profile-full-name">{t('fullName')}</Label>
                  <Input
                    id="profile-full-name"
                    value={profileForm.fullName}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="profile-email">{t('email')}</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profileForm.email}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
                {profileError ? (
                  <div className="sm:col-span-2">
                    <p
                      className={
                        profileError === 'profileSaved'
                          ? 'text-sm text-muted-foreground'
                          : 'text-sm text-destructive'
                      }
                    >
                      {t(profileError)}
                    </p>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full justify-center"
                  >
                    <SaveIcon data-icon="inline-start" />
                    {isSavingProfile ? t('savingProfile') : t('saveProfile')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="flex flex-1 flex-col">
          <Card className="flex-1 border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full border border-border bg-[#2a1d18] text-foreground">
                    <MapPinIcon />
                  </div>
                  <div className="flex flex-col gap-1">
                    <CardTitle>{t('addressesTitle')}</CardTitle>
                    <CardDescription>
                      {t('addressesDescription')}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full justify-center sm:w-auto"
                  onClick={openCreateAddressDialog}
                >
                  <PlusIcon data-icon="inline-start" />
                  {t('addAddress')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!hasAddresses ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm leading-7 text-muted-foreground">
                  {t('addressesEmpty')}
                </div>
              ) : null}

              {addressError && !isAddressDialogOpen ? (
                <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertTriangleIcon className="mt-0.5 shrink-0" />
                  <p>{t(addressError)}</p>
                </div>
              ) : null}

              {sortedAddresses.map((address) => (
                <div
                  key={address.id}
                  className="rounded-2xl border border-border bg-background/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {address.label}
                        </p>
                        {address.isDefault ? (
                          <Badge
                            variant="secondary"
                            className="bg-[#3a2922] text-foreground"
                          >
                            {t('defaultBadge')}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-sm leading-7 text-muted-foreground">
                        <p>{address.recipientFullName}</p>
                        <p>{address.recipientEmail}</p>
                        <p>{address.recipientPhone}</p>
                        <p>
                          {address.addressLine}, {address.city}{' '}
                          {address.postalCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!address.isDefault ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSwitchingDefaultId === address.id}
                          onClick={() => handleSetDefault(address.id)}
                        >
                          {isSwitchingDefaultId === address.id
                            ? t('settingDefault')
                            : t('setDefault')}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-sky-500/30 text-sky-700 hover:bg-sky-500/10 hover:text-sky-800 dark:text-sky-200"
                        onClick={() => beginEditAddress(address)}
                      >
                        <PencilLineIcon data-icon="inline-start" />
                        {t('editAddress')}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isDeletingAddressId === address.id}
                        onClick={() => setConfirmDeleteAddressId(address.id)}
                      >
                        <Trash2Icon data-icon="inline-start" />
                        {isDeletingAddressId === address.id
                          ? t('deletingAddress')
                          : t('deleteAddress')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <p className="text-sm leading-7 text-muted-foreground">
                {hasAddresses
                  ? t('checkoutAddressNote')
                  : t('checkoutAddressEmptyNote')}{' '}
                <Link
                  href="/checkout"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  {t('goToCheckout')}
                </Link>
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      {isAddressDialogOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-90 flex items-center justify-center bg-[rgba(28,18,14,0.52)] px-4 py-6 backdrop-blur-sm sm:px-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="address-dialog-title"
            >
              <Card className="flex max-h-[calc(100dvh-8rem)] w-full max-w-2xl flex-col border-border/90 bg-background/98 py-0 shadow-[0_30px_90px_rgba(28,18,14,0.28)] sm:max-h-[calc(100dvh-3rem)]">
                <CardHeader className="gap-3 border-b border-border/80 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <CardTitle id="address-dialog-title">
                        {editingAddressId
                          ? t('editAddressTitle')
                          : t('addAddressTitle')}
                      </CardTitle>
                      <CardDescription>
                        {t('addressFormDescription')}
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={resetAddressForm}
                      aria-label={t('cancelEditing')}
                    >
                      <XIcon />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 overflow-y-auto py-4">
                  <form
                    id="address-dialog-form"
                    className="flex flex-col gap-4"
                    onSubmit={handleAddressSubmit}
                  >
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="address-label">{t('addressLabel')}</Label>
                      <Input
                        id="address-label"
                        aria-invalid={Boolean(addressFieldErrors.label)}
                        value={addressForm.label}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                      />
                      {addressFieldErrors.label ? (
                        <p className="text-sm text-destructive">
                          {t(addressFieldErrors.label)}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="recipient-name">
                        {t('recipientFullName')}
                      </Label>
                      <Input
                        id="recipient-name"
                        aria-invalid={Boolean(
                          addressFieldErrors.recipientFullName,
                        )}
                        value={addressForm.recipientFullName}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            recipientFullName: event.target.value,
                          }))
                        }
                      />
                      {addressFieldErrors.recipientFullName ? (
                        <p className="text-sm text-destructive">
                          {t(addressFieldErrors.recipientFullName)}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="recipient-email">
                          {t('recipientEmail')}
                        </Label>
                        <Input
                          id="recipient-email"
                          type="email"
                          aria-invalid={Boolean(
                            addressFieldErrors.recipientEmail,
                          )}
                          value={addressForm.recipientEmail}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              recipientEmail: event.target.value,
                            }))
                          }
                        />
                        {addressFieldErrors.recipientEmail ? (
                          <p className="text-sm text-destructive">
                            {t(addressFieldErrors.recipientEmail)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="recipient-phone">
                          {t('recipientPhone')}
                        </Label>
                        <Input
                          id="recipient-phone"
                          inputMode="numeric"
                          maxLength={10}
                          aria-invalid={Boolean(
                            addressFieldErrors.recipientPhone,
                          )}
                          value={addressForm.recipientPhone}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              recipientPhone: normalizePhoneInput(
                                event.target.value,
                              ),
                            }))
                          }
                        />
                        {addressFieldErrors.recipientPhone ? (
                          <p className="text-sm text-destructive">
                            {t(addressFieldErrors.recipientPhone)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="address-line">{t('addressLine')}</Label>
                      <Input
                        id="address-line"
                        aria-invalid={Boolean(addressFieldErrors.addressLine)}
                        value={addressForm.addressLine}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            addressLine: event.target.value,
                          }))
                        }
                      />
                      {addressFieldErrors.addressLine ? (
                        <p className="text-sm text-destructive">
                          {t(addressFieldErrors.addressLine)}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="address-city">{t('city')}</Label>
                        <Input
                          id="address-city"
                          aria-invalid={Boolean(addressFieldErrors.city)}
                          value={addressForm.city}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              city: event.target.value,
                            }))
                          }
                        />
                        {addressFieldErrors.city ? (
                          <p className="text-sm text-destructive">
                            {t(addressFieldErrors.city)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="address-postal-code">
                          {t('postalCode')}
                        </Label>
                        <Input
                          id="address-postal-code"
                          aria-invalid={Boolean(addressFieldErrors.postalCode)}
                          value={addressForm.postalCode}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              postalCode: event.target.value,
                            }))
                          }
                        />
                        {addressFieldErrors.postalCode ? (
                          <p className="text-sm text-destructive">
                            {t(addressFieldErrors.postalCode)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {addressError ? (
                      <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        <AlertTriangleIcon className="mt-0.5 shrink-0" />
                        <p>{t(addressError)}</p>
                      </div>
                    ) : null}
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 border-t border-border/80 bg-background/96 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={resetAddressForm}
                  >
                    {t('cancelEditing')}
                  </Button>
                  <Button
                    type="submit"
                    form="address-dialog-form"
                    className="w-full sm:w-auto"
                    disabled={isSavingAddress}
                  >
                    <SaveIcon data-icon="inline-start" />
                    {isSavingAddress ? t('savingAddress') : submitLabel}
                  </Button>
                </CardFooter>
              </Card>
            </div>,
            document.body,
          )
        : null}
      <ConfirmDialog
        open={Boolean(confirmDeleteAddressId)}
        title={t('confirmDeleteAddressTitle')}
        description={t('confirmDeleteAddressDescription')}
        confirmLabel={t('confirmDeleteAddress')}
        cancelLabel={t('cancelConfirm')}
        destructive
        isPending={Boolean(confirmDeleteAddressId && isDeletingAddressId)}
        onClose={() => {
          if (!isDeletingAddressId) {
            setConfirmDeleteAddressId(null);
          }
        }}
        onConfirm={async () => {
          if (!confirmDeleteAddressId) {
            return;
          }

          await handleDeleteAddress(confirmDeleteAddressId);
        }}
      />
    </main>
  );
}
