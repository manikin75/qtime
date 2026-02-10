import { useEffect, useState, useMemo } from 'react';
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
  const { payzlipReportedDays, payzlipVerifiedDays } = usePayzlip();
  const [daysToVerify, setDaysToVerify] = useState<PayzlipDate[]>([]);

  const unverifiedDays = useMemo<PayzlipDate[]>(() => {
    if (!payzlipReportedDays?.length) return [];

    return payzlipReportedDays.filter((d) => !payzlipVerifiedDays?.includes(d));
  }, [payzlipReportedDays, payzlipVerifiedDays]);

  useEffect(() => {
    if (!open) return;

    // setDaysToVerify(unverifiedDays);
  }, [open, unverifiedDays]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="p-4">
          <DialogTitle>Verify days</DialogTitle>
          <DialogDescription>
            Mark the days you have reported to Payzlip as verified
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          The following days have been reported to Payzlip, but not yet
          verified:
          <div className="flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
            {unverifiedDays?.map((date) => (
              <div
                key={date}
                className="flex flex-row gap-2 justify-start items-start hover:bg-stone-200 px-1 rounded-md cursor-pointer"
                onClick={() => {
                  setDaysToVerify((prev) =>
                    prev.includes(date)
                      ? prev.filter((d) => d !== date)
                      : [...prev, date],
                  );
                }}
              >
                <input
                  type="checkbox"
                  className="mt-1.5"
                  checked={daysToVerify.includes(date)}
                />
                <div key={date}>{date}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-row gap-4"></div>
        </div>
        <DialogFooter className="bg-stone-500 p-4">
          <DialogClose asChild>
            <Button className="min-w-[100px]" onClick={handleCancel}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
