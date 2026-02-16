import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn.util';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from '../Dialog';
import { Button } from '../Button';
import { usePayzlip } from '../../hooks/usePayzlip';
import { type PayzlipDate } from '../../types/project';

interface VerifyDaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VerifyDaysDialog = ({
  open,
  onOpenChange,
}: VerifyDaysDialogProps) => {
  const { payzlipReportedDays, payzlipVerifiedDays, reports } = usePayzlip();
  const unverifiedDays = useMemo<PayzlipDate[]>(() => {
    if (!payzlipReportedDays?.length) return [];

    return payzlipReportedDays.filter((d) => !payzlipVerifiedDays?.includes(d));
  }, [payzlipReportedDays, payzlipVerifiedDays]);
  const [daysToVerify, setDaysToVerify] =
    useState<PayzlipDate[]>(unverifiedDays);
  const [currentSelectedRow, setCurrentSelectedRow] = useState<number>(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentSelectedRow + 1 < unverifiedDays.length) {
          setCurrentSelectedRow((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentSelectedRow > 0) {
          setCurrentSelectedRow((prev) => prev - 1);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        console.log(unverifiedDays[currentSelectedRow]);
        if (daysToVerify.includes(unverifiedDays[currentSelectedRow])) {
          setDaysToVerify((prev) =>
            prev.filter((d) => d !== unverifiedDays[currentSelectedRow]),
          );
        } else {
          setDaysToVerify((prev) => [
            ...prev,
            unverifiedDays[currentSelectedRow],
          ]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [unverifiedDays, currentSelectedRow, unverifiedDays]);

  useEffect(() => {
    if (!open) return;
    console.log({ reports });

    // const hours = getAllForDate(date);
    // console.log({ hours });
    // await reportHoursForDate(date, hours);

    // setDaysToVerify(unverifiedDays);
  }, [open, unverifiedDays]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleVerify = () => {
    if (!daysToVerify.length) return;
    // console.log({ currentSelectedDate });
    // await verifyDays(currentSelectedDate);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="p-4">
          <DialogTitle>Verify days</DialogTitle>
          <DialogDescription>
            Navigate with arrow keys, check/uncheck with space
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          The following days have been reported to Payzlip, but not yet
          verified:
          <table className="max-h-[80vh] overflow-y-auto">
            <tbody>
              {unverifiedDays?.map((date, i) => (
                <tr
                  key={date}
                  className={cn(
                    'flex gap-2 justify-start items-start px-1 rounded-md cursor-pointer',
                    i === currentSelectedRow && 'bg-stone-200',
                  )}
                  onMouseEnter={() => setCurrentSelectedRow(i)}
                  onClick={() => {
                    setDaysToVerify((prev) =>
                      prev.includes(date)
                        ? prev.filter((d) => d !== date)
                        : [...prev, date],
                    );
                  }}
                >
                  <td className="w-4">
                    <input
                      type="checkbox"
                      className="mt-1.5"
                      checked={daysToVerify.includes(date)}
                    />
                  </td>
                  <td className="w-14">{format(date, 'd MMM')}</td>
                  <td className="w-8 text-sm mt-1 text-stone-600">
                    {format(date, 'EE')}
                  </td>
                  <td>{reports[date]?.workedHours || 0} h</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-row gap-4"></div>
        </div>
        <DialogFooter className="bg-stone-500 p-4">
          <DialogClose>
            <Button className="min-w-25" onClick={handleCancel}>
              Close
            </Button>
          </DialogClose>
          <Button
            className="min-w-25 bg-amber-500"
            onClick={handleVerify}
            disabled={!daysToVerify.length}
          >
            Verify days
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
