import { useEffect, useState, useMemo } from 'react';
import { TailSpin } from 'react-loader-spinner';
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
  const {
    payzlipReportedDays,
    payzlipVerifiedDays,
    reports,
    getReports,
    verifyDays,
  } = usePayzlip();
  const [daysToVerify, setDaysToVerify] = useState<PayzlipDate[]>([]);
  const [currentSelectedRow, setCurrentSelectedRow] = useState<number>(0);
  const [processing, setProcessing] = useState<string | null>(null);
  const unverifiedDays = useMemo<PayzlipDate[]>(() => {
    if (!payzlipReportedDays?.length) return [];
    return payzlipReportedDays.filter((d) => !payzlipVerifiedDays?.includes(d));
  }, [payzlipReportedDays, payzlipVerifiedDays]);

  useEffect(() => {
    setDaysToVerify(unverifiedDays);
    setProcessing(null);
  }, [unverifiedDays]);

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

  const handleVerify = async () => {
    if (!daysToVerify.length) return;
    setProcessing('PATCH');
    const ret = await verifyDays(daysToVerify);
    if (ret < 400) {
      // Success
      const [year, month] = daysToVerify[0].split('-').map((s) => parseInt(s));
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      setProcessing('GET');
      getReports(start, end);
      onOpenChange(false);
      setProcessing(null);
      return;
    }
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
        <DialogFooter className="bg-stone-500 p-4 relative">
          <div className="absolute left-4 top-6 text-white">{processing}</div>
          <DialogClose>
            <Button className="min-w-25" onClick={handleCancel}>
              Close
            </Button>
          </DialogClose>
          <Button
            className="min-w-25 bg-amber-500 flex items-center justify-center"
            onClick={handleVerify}
            disabled={!daysToVerify.length || processing !== null}
          >
            {processing ? (
              <TailSpin
                visible={true}
                height="25"
                width="25"
                color="#fff"
                ariaLabel="tail-spin-loading"
                radius="1"
                wrapperStyle={{}}
                wrapperClass=""
              />
            ) : (
              'Verify days'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
