import { usePayzlip } from '../hooks/usePayzlip';
import { format } from 'date-fns';
import { WithTooltip } from './WithTooltip';
import { TailSpin } from 'react-loader-spinner';
import { type PayzlipDate } from '../types/project';
import { cn } from '../utils/cn.util';

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
  const reportedSum =
    reports[format(date, 'yyyy-MM-dd') as PayzlipDate]?.workedHours;
  const isVerified = payzlipVerifiedDays?.includes(
    format(date, 'yyyy-MM-dd') as PayzlipDate,
  );
  const isReported = payzlipReportedDays?.includes(
    format(date, 'yyyy-MM-dd') as PayzlipDate,
  );

  return (
    <div
      key={`sum-${date.toISOString()}`}
      className={cn(
        'text-center font-semibold  px-2 py-1 bg-stone-600 rounded-md mt-2',
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
          <span>{sum || '-'}</span>
        </WithTooltip>
      )}
    </div>
  );
};
