import { usePayzlip } from '../hooks/usePayzlip';
import { format } from 'date-fns';
import { WithTooltip } from './WithTooltip';
import { TailSpin } from 'react-loader-spinner';
import { type PayzlipDate } from '../types/project';
import { cn } from '../utils/cn.util';
import { useMemo } from 'react';

interface DailySumProps {
  date: Date;
  calendarSum: number;
  busy: boolean;
  uploadDayToPayzlip: (date: Date) => void;
}

export const DailySum = ({
  date,
  calendarSum,
  busy,
  uploadDayToPayzlip,
}: DailySumProps) => {
  const { payzlipReportedDays, payzlipVerifiedDays, reports } = usePayzlip();

  const sum = calendarSum;
  const shortDate = useMemo(
    () => format(date, 'yyyy-MM-dd') as PayzlipDate,
    [date],
  );
  const reportedSum = reports[shortDate]?.workedHours;
  const isVerified = useMemo(
    () => payzlipVerifiedDays?.includes(shortDate),
    [payzlipVerifiedDays, shortDate],
  );
  const isReported = useMemo(
    () => payzlipReportedDays?.includes(shortDate),
    [payzlipReportedDays, shortDate],
  );

  return (
    <div
      key={`sum-${date.toISOString()}`}
      className={cn(
        'bg-stone-600 rounded-md mt-2 flex items-center justify-center',
        !isVerified && sum && 'cursor-pointer',
        isVerified
          ? 'border border-green-500 bg-green-700'
          : reportedSum && reportedSum !== sum
            ? 'border border-amber-600 bg-amber-950'
            : isReported && 'border border-green-600 bg-green-950',
        sum === 0
          ? 'text-stone-400'
          : sum >= 8
            ? 'text-white'
            : 'text-yellow-500',
      )}
      onClick={() => {
        if (!busy && !isVerified) uploadDayToPayzlip(date);
      }}
    >
      {busy ? (
        <div className="mt-1">
          <TailSpin
            visible={true}
            height="14"
            width="14"
            color="#fff"
            ariaLabel="tail-spin-loading"
            radius="1"
            wrapperStyle={{}}
            wrapperClass=""
          />
        </div>
      ) : (
        <WithTooltip
          content={
            payzlipVerifiedDays?.includes(
              format(date, 'yyyy-MM-dd') as PayzlipDate,
            )
              ? 'Verified day'
              : reportedSum && reportedSum !== sum
                ? `Reported hours (${reportedSum}h) do not match the hours in the calendar (${sum}h)`
                : payzlipReportedDays?.includes(
                      format(date, 'yyyy-MM-dd') as PayzlipDate,
                    )
                  ? 'Reported, but not yet verified'
                  : sum
                    ? 'Click to report this day to Payzlip'
                    : 'No hours entered for this day'
          }
        >
          <div className="text-center font-semibold">{sum || '-'}</div>
        </WithTooltip>
      )}
    </div>
  );
};
