import { useEffect, useState, useMemo, useEffectEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TailSpin } from 'react-loader-spinner';
import { useHotkey } from '@tanstack/react-hotkeys';
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
  const { payzlipReportedDays, payzlipVerifiedDays, reports, verifyDays } =
    usePayzlip();
  const [currentSelectedRow, setCurrentSelectedRow] = useState<number>(0);
  const [processing, setProcessing] = useState<string | null>(null);
  const unverifiedDays = useMemo<PayzlipDate[]>(() => {
    if (!payzlipReportedDays?.length) return [];
    return payzlipReportedDays.filter((d) => !payzlipVerifiedDays?.includes(d));
  }, [payzlipReportedDays, payzlipVerifiedDays]);
  const [daysToVerify, setDaysToVerify] = useState<PayzlipDate[]>([]);
  const queryClient = useQueryClient();

  const updateVerifiedDays = useEffectEvent(() => {
    setDaysToVerify(unverifiedDays);
    setProcessing(null);
  });

  useEffect(() => {
    updateVerifiedDays();
  }, [unverifiedDays]);

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
      setProcessing('GET');
      queryClient.invalidateQueries({ queryKey: ['reports', year, month] });
      onOpenChange(false);
      setProcessing(null);
      return;
    }
  };

  // Keyboard shortcuts
  useHotkey('Escape', () => onOpenChange(false), { enabled: open });
  useHotkey('Enter', () => handleVerify(), { enabled: open });
  useHotkey(
    'ArrowDown',
    () => {
      if (currentSelectedRow + 1 < unverifiedDays.length) {
        setCurrentSelectedRow((prev) => prev + 1);
      }
    },
    { enabled: open, ignoreInputs: false },
  );
  useHotkey(
    'ArrowUp',
    () => {
      if (currentSelectedRow > 0) {
        setCurrentSelectedRow((prev) => prev - 1);
      }
    },
    { enabled: open, ignoreInputs: false },
  );
  useHotkey(
    'Space',
    () => {
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
    },
    { enabled: open, ignoreInputs: false },
  );

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
                    i === currentSelectedRow && 'bg-cyan-800',
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
                      className="mt-1.5 focus:ring-0 focus:ring-offset-0"
                      checked={daysToVerify.includes(date)}
                    />
                  </td>
                  <td className="w-14">{format(date, 'd MMM')}</td>
                  <td className="w-8 text-sm mt-1 text-stone-300">
                    {format(date, 'EE')}
                  </td>
                  <td>{reports[date]?.workedHours || 0} h</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-row gap-4"></div>
        </div>
        <DialogFooter className=" relative">
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
