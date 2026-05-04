'use client';

import { ArrowRightIcon, BellIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import type { NotificationItem } from '@/features/notifications/schemas';
import { listNotifications } from '@/services/notifications';
import { useNotificationsStore } from '@/store/use-notifications-store';

type NotificationsMenuProps = {
  audience: 'admin' | 'customer';
  className?: string;
  sideOffset?: number;
};

function formatNotificationDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function NotificationsMenu({
  audience,
  className,
  sideOffset = 14,
}: NotificationsMenuProps) {
  const locale = useLocale();
  const t = useTranslations('notifications');
  const [open, setOpen] = useState(false);
  const [isAllOpen, setIsAllOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [allItems, setAllItems] = useState<NotificationItem[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const items = useNotificationsStore((state) => state.items);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const isConnecting = useNotificationsStore((state) => state.isConnecting);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const previewItems = items.slice(0, 5);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobileViewport(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener('change', sync);

    return () => {
      mediaQuery.removeEventListener('change', sync);
    };
  }, []);

  async function handleOpenAll() {
    setOpen(false);
    setIsAllOpen(true);
    setIsLoadingAll(true);

    try {
      const snapshot = await listNotifications(50);
      setAllItems(snapshot.items);
    } finally {
      setIsLoadingAll(false);
    }
  }

  function renderNotificationRows(
    entries: NotificationItem[],
    onNavigate?: () => void,
  ) {
    return entries.map((item) => {
      const href = item.orderNo
        ? audience === 'admin'
          ? `/admin/orders/${item.orderNo}`
          : `/orders/${item.orderNo}`
        : null;
      const title = locale === 'th' ? item.titleTh : item.titleEn;
      const body = locale === 'th' ? item.bodyTh : item.bodyEn;

      if (href) {
        return (
          <Link
            key={item.id}
            href={href}
            className="flex items-start gap-3 rounded-[1.2rem] px-3 py-3 transition hover:bg-white/4"
            onClick={() => {
              if (!item.isRead) {
                void markAsRead(item.id);
              }
              onNavigate?.();
            }}
          >
            <div
              className={cn(
                'mt-1 size-2 rounded-full',
                item.isRead ? 'bg-border' : 'bg-[#b96f5a]',
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{title}</p>
                {!item.isRead ? (
                  <span className="rounded-full bg-[#b96f5a]/16 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#e8c1b2]">
                    {t('new')}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {body}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatNotificationDate(item.createdAt, locale)}
              </p>
            </div>
          </Link>
        );
      }

      return (
        <button
          key={item.id}
          type="button"
          className="flex w-full items-start gap-3 rounded-[1.2rem] px-3 py-3 text-left transition hover:bg-white/4"
          onClick={() => {
            if (!item.isRead) {
              void markAsRead(item.id);
            }
          }}
        >
          <div
            className={cn(
              'mt-1 size-2 rounded-full',
              item.isRead ? 'bg-border' : 'bg-[#b96f5a]',
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{title}</p>
              {!item.isRead ? (
                <span className="rounded-full bg-[#b96f5a]/16 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#e8c1b2]">
                  {t('new')}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {body}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatNotificationDate(item.createdAt, locale)}
            </p>
          </div>
        </button>
      );
    });
  }

  const allViewItems = allItems.length > 0 ? allItems : items;

  const triggerButton = (
    <Button
      variant="outline"
      size="icon"
      className={cn('relative shrink-0 rounded-full', className)}
      aria-label={t('openMenu', { count: unreadCount })}
    >
      <BellIcon />
      {unreadCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-[#b96f5a] px-1.5 py-0.5 text-[0.62rem] font-semibold leading-none text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Button>
  );

  const allNotificationsSheet = (
    <Sheet open={isAllOpen} onOpenChange={setIsAllOpen}>
      <SheetContent
        side={isMobileViewport ? 'bottom' : 'right'}
        overlayClassName="z-[130] bg-[rgba(15,10,8,0.22)] supports-backdrop-filter:backdrop-blur-[3px]"
        className={cn(
          'z-140 border-border/90 bg-background/96 px-0 py-0',
          isMobileViewport
            ? 'h-dvh rounded-none data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:top-0 data-[side=bottom]:rounded-none data-[side=bottom]:border-0'
            : 'w-md data-[side=right]:w-md',
        )}
      >
        <SheetHeader className="border-b border-border/70 px-5 py-4">
          <div className="flex items-start justify-between gap-3 pr-10">
            <div className="space-y-1">
              <SheetTitle>{t('title')}</SheetTitle>
              <SheetDescription>{t('viewAllDescription')}</SheetDescription>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
                onClick={() => void markAllAsRead()}
              >
                {t('markAllRead')}
              </button>
            ) : null}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-3">
          {isLoadingAll || (isConnecting && allViewItems.length === 0) ? (
            <div className="px-3 py-6 text-sm text-muted-foreground">
              {t('loading')}
            </div>
          ) : allViewItems.length === 0 ? (
            <div className="px-3 py-6 text-sm text-muted-foreground">
              {t('empty')}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {renderNotificationRows(allViewItems, () => setIsAllOpen(false))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  if (isMobileViewport) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className={cn('relative shrink-0 rounded-full', className)}
          aria-label={t('openMenu', { count: unreadCount })}
          onClick={() => void handleOpenAll()}
        >
          <BellIcon />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-[#b96f5a] px-1.5 py-0.5 text-[0.62rem] font-semibold leading-none text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
        {allNotificationsSheet}
      </>
    );
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={sideOffset}
          className="w-88 rounded-[1.75rem] p-2"
        >
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <DropdownMenuLabel className="px-0 py-0 text-sm font-semibold tracking-normal text-foreground normal-case">
              {t('title')}
            </DropdownMenuLabel>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
                onClick={() => void markAllAsRead()}
              >
                {t('markAllRead')}
              </button>
            ) : null}
          </div>

          <DropdownMenuSeparator />

          {isConnecting && items.length === 0 ? (
            <div className="px-3 py-6 text-sm text-muted-foreground">
              {t('loading')}
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-6 text-sm text-muted-foreground">
              {t('empty')}
            </div>
          ) : (
            <DropdownMenuGroup>
              {previewItems.map((item) => {
                const href = item.orderNo
                  ? audience === 'admin'
                    ? `/admin/orders/${item.orderNo}`
                    : `/orders/${item.orderNo}`
                  : null;
                const title = locale === 'th' ? item.titleTh : item.titleEn;
                const body = locale === 'th' ? item.bodyTh : item.bodyEn;

                if (href) {
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      asChild
                      className="items-start rounded-[1.2rem] px-3 py-3"
                    >
                      <Link
                        href={href}
                        onClick={() => {
                          if (!item.isRead) {
                            void markAsRead(item.id);
                          }
                          setOpen(false);
                        }}
                      >
                        <div
                          className={cn(
                            'mt-1 size-2 rounded-full',
                            item.isRead ? 'bg-border' : 'bg-[#b96f5a]',
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">
                              {title}
                            </p>
                            {!item.isRead ? (
                              <span className="rounded-full bg-[#b96f5a]/16 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#e8c1b2]">
                                {t('new')}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {body}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatNotificationDate(item.createdAt, locale)}
                          </p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                }

                return (
                  <DropdownMenuItem
                    key={item.id}
                    className="items-start rounded-[1.2rem] px-3 py-3"
                    onSelect={() => {
                      if (!item.isRead) {
                        void markAsRead(item.id);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        'mt-1 size-2 rounded-full',
                        item.isRead ? 'bg-border' : 'bg-[#b96f5a]',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">
                          {title}
                        </p>
                        {!item.isRead ? (
                          <span className="rounded-full bg-[#b96f5a]/16 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#e8c1b2]">
                            {t('new')}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {body}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatNotificationDate(item.createdAt, locale)}
                      </p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          )}

          {items.length > 0 ? (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 pt-1 pb-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-[1.1rem] px-3 py-2.5 text-[0.82rem] font-medium text-muted-foreground transition hover:bg-white/4 hover:text-foreground"
                  onClick={() => void handleOpenAll()}
                >
                  <span>{t('viewAll')}</span>
                  <ArrowRightIcon className="size-3.5" />
                </button>
              </div>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {allNotificationsSheet}
    </>
  );
}
