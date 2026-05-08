'use client';

import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col gap-4 sm:flex-row',
        month: 'flex flex-col gap-4',
        caption: 'relative flex items-center justify-center pt-1',
        caption_label: 'text-sm font-medium text-foreground',
        nav: 'flex items-center gap-1',
        button_previous:
          'absolute left-1 inline-flex size-8 items-center justify-center rounded-full border border-border/70 bg-background/75 text-muted-foreground transition hover:text-foreground',
        button_next:
          'absolute right-1 inline-flex size-8 items-center justify-center rounded-full border border-border/70 bg-background/75 text-muted-foreground transition hover:text-foreground',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'w-10 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground',
        week: 'mt-2 flex w-full',
        day: 'size-10 p-0 text-sm',
        day_button:
          'inline-flex size-10 items-center justify-center rounded-full text-sm text-foreground transition hover:bg-muted hover:text-foreground',
        selected:
          'rounded-full bg-primary text-[#20120f] font-semibold hover:bg-primary hover:text-[#20120f] focus:bg-primary focus:text-[#20120f] [&>button]:text-[#20120f] [&>button]:font-semibold',
        range_start:
          'rounded-full bg-primary text-[#20120f] font-semibold hover:bg-primary hover:text-[#20120f] [&>button]:text-[#20120f] [&>button]:font-semibold',
        range_end:
          'rounded-full bg-primary text-[#20120f] font-semibold hover:bg-primary hover:text-[#20120f] [&>button]:text-[#20120f] [&>button]:font-semibold',
        range_middle:
          'rounded-none bg-[#d8b2a2]/28 text-[#f6ebe6] hover:bg-[#d8b2a2]/36',
        today: 'rounded-full border border-border/70 text-foreground',
        outside: 'text-muted-foreground/45',
        disabled: 'text-muted-foreground/35',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) =>
          orientation === 'left' ? (
            <ChevronLeftIcon
              className={cn('size-4', iconClassName)}
              {...iconProps}
            />
          ) : (
            <ChevronRightIcon
              className={cn('size-4', iconClassName)}
              {...iconProps}
            />
          ),
      }}
      {...props}
    />
  );
}
