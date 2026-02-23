import { useMemo } from 'react';
import { useYearlySummary } from '../../hooks/useYearlySummary';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '../Dialog';
import { Button } from '../Button';

const getDaysInYear = (year: number) => {
  const date = new Date(year, 0, 1);
  const days = [] as Date[];
  while (date.getFullYear() === year) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface YearlySummaryDialogProps {
  year: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const YearlySummaryDialog = ({
  year,
  open,
  onOpenChange,
}: YearlySummaryDialogProps) => {
  const { nationalHolidays, values } = useYearlySummary({ year });

  const holidaySet = useMemo(
    () => new Set(nationalHolidays.map((h) => h.date)),
    [nationalHolidays],
  );
  const days = useMemo(() => getDaysInYear(year), [year]);

  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    let week: (Date | null)[] = [];

    days.forEach((day, index) => {
      const weekday = day.getDay();

      if (index === 0) {
        for (let i = 0; i < weekday; i++) week.push(null);
      }

      week.push(day);

      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    });

    if (week.length) {
      while (week.length < 7) week.push(null);
      result.push(week);
    }

    return result;
  }, [days]);

  const months = useMemo(() => {
    const positions: { label: string; weekIndex: number }[] = [];

    weeks.forEach((week, weekIndex) => {
      const firstDay = week.find(Boolean);
      if (!firstDay) return;

      const month = firstDay.getMonth();

      if (!positions.some((p) => p.label === monthLabels[month])) {
        positions.push({ label: monthLabels[month], weekIndex });
      }
    });

    return positions;
  }, [weeks]);

  const getCellStyle = (date: Date | null) => {
    if (!date) return 'bg-transparent';

    const key = formatDateKey(date);

    if (holidaySet.has(key)) return 'bg-red-700';

    const worked = values?.[key];

    if (!worked) return 'bg-stone-600';

    return 'bg-green-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-160 max-w-none">
        <DialogHeader className="p-4">
          <DialogTitle>{year}</DialogTitle>
        </DialogHeader>
        <div className="my-10 mx-5 overflow-x-auto w-full text-xs text-stone-300 dark:text-gray-400">
          <div className="inline-block">
            {/* Month labels */}
            <div className="flex ml-8 mb-2">
              {weeks.map((_, weekIndex) => {
                const month = months.find((m) => m.weekIndex === weekIndex);

                return (
                  <div key={weekIndex} className="w-2 mr-[0.2em]">
                    {month ? month.label : ''}
                  </div>
                );
              })}
            </div>

            <div className="flex">
              {/* Weekday labels */}
              <div className="flex flex-col mr-2">
                {weekdayLabels.map((label, i) => (
                  <div key={i} className="h-[0.55em] mb-[0.2em]">
                    {i % 2 === 1 ? label : ''}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex gap-[0.2em]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[0.2em]">
                    {week.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`w-2 h-2 rounded-sm ${getCellStyle(day)}`}
                        title={day ? formatDateKey(day) : ''}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>{' '}
        <DialogFooter className="">
          <DialogClose asChild>
            <Button className="min-w-25" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
