import { useState, useEffect } from 'react';
import { cn } from '@sglara/cn';
import { format, isToday, isWeekend } from 'date-fns';
import { NumberInput } from './NumberInput';
import { Button } from './Button';
import { WithTooltip } from './WithTooltip';
import { useCalendar, ABSENCE_DESCRIPTION } from '../hooks/useCalendar';
import { usePayzlip } from '../hooks/usePayzlip';
import { TailSpin } from 'react-loader-spinner';
import { InfoIcon, SealCheckIcon } from '@phosphor-icons/react';
import { type PayzlipDate, type Project } from '../types/project';
import { type NationalHoliday } from '../hooks/useNationalHolidays';

export const Calendar = ({
  year,
  month,
  projects,
  setAbsenceDialogOpen,
  setVerifyDaysDialogOpen,
}: {
  year: number;
  month: number;
  projects: Project[];
  setAbsenceDialogOpen: (open: boolean) => void;
  setVerifyDaysDialogOpen: (open: boolean) => void;
}) => {
  const [tooltip, setTooltip] = useState<NationalHoliday | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { payzlipReportedDays, payzlipVerifiedDays, reports } = usePayzlip();

  const {
    inputRefs,
    activeCell,
    setActiveCell,
    setValue,
    getValue,
    rowSum,
    columnSum,
    totalSum,
    isSelected,
    daysInMonth,
    onFocus,
    onNavigate,
    onSelectExtend,
    // onActivate,
    selection,
    setSelection,
    isMultiSelected,
    nationalHolidays,
    isNationalHoliday,
    absence,
    getAbsenceKey,
    uploadDayToPayzlip,
    uploadingDate,
  } = useCalendar({ year, month, projects });

  const showTooltip = (date: Date) => {
    const holiday = nationalHolidays.find(
      (d) => d.date === format(date, 'yyyy-MM-dd'),
    );
    if (!holiday) return;
    setTooltip(holiday);
  };

  useEffect(() => {
    const stop = () => setIsDragging(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  useEffect(() => {
    if (!projects.length) return;
    // setActiveCell({ row: projects[0].id, col: new Date().getDay() });
    setTimeout(() => {
      document
        .getElementById(`${projects[0].id}-${new Date().toISOString()}`)
        ?.focus();
    }, 100);
  }, [projects]);

  return (
    <div className="my-10 overflow-x-auto w-full">
      <div
        className="grid gap-1 text-sm w-full"
        style={{
          gridTemplateColumns: `400px repeat(${daysInMonth.length}, 28px) auto`,
        }}
      >
        {/* ===== Header row ===== */}
        <div className="sticky left-0 z-20" />

        {daysInMonth.map((date) => (
          <div
            key={date.toISOString()}
            className={cn(
              'flex flex-col items-center px-4 gap-1 border-b border-stone-600 py-1 relative',
              isNationalHoliday(date) && 'text-red-500 cursor-pointer',
              isWeekend(date) && 'text-red-500',
              isToday(date) && 'bg-cyan-900 rounded',
            )}
            onMouseEnter={() =>
              isNationalHoliday(date) ? showTooltip(date) : null
            }
            onMouseLeave={() => setTooltip(null)}
          >
            {tooltip && tooltip.date === format(date, 'yyyy-MM-dd') && (
              <div className="absolute z-10 top-0 left-0 w-40  bg-slate-900 text-white rounded-sm p-1 -translate-x-1/2">
                {tooltip?.local_name || tooltip?.name}
              </div>
            )}
            <span className="text-xs">{format(date, 'EE')}</span>
            <span className="font-semibold">{format(date, 'd')}</span>
          </div>
        ))}

        <div className="font-semibold text-right pr-2 mt-6 ms-6 me-1 opacity-70">
          Σ
        </div>

        {/* ===== Absence rows ===== */}
        <div className="sticky left-0 z-10 flex-row gap-x-2 items-center flex font-medium rounded-sm ps-2 py-1 italic opacity-50">
          Absence{' '}
          <InfoIcon size="16" onClick={() => setAbsenceDialogOpen(true)} />
        </div>
        {daysInMonth.map((date) => (
          <div
            key={'absence_' + date.toISOString()}
            className={cn(
              'flex flex-col items-center px-4 gap-1 relative text-lg cursor-pointer',
            )}
          >
            {absence[getAbsenceKey(year, month, date.getDate())] && (
              <WithTooltip
                content={
                  ABSENCE_DESCRIPTION[
                    absence[getAbsenceKey(year, month, date.getDate())] || '🤒'
                  ]
                }
              >
                <span className="text-stone-700">
                  {' '}
                  {absence[getAbsenceKey(year, month, date.getDate())] ?? ' '}
                </span>
              </WithTooltip>
            )}
          </div>
        ))}
        <div />

        {/* ===== Project rows ===== */}
        {projects.map((project, rowIndex) => (
          <>
            {/* Project name (sticky) */}
            <div
              key={project.id}
              className={cn(
                'left-0 z-10 flex-col flex items-start font-sm rounded-sm ps-2 pt-1 relative',
                // activeCell?.row === project.id && 'bg-stone-700',
                isSelected(project.id, activeCell?.col || 0) && 'bg-stone-700',
              )}
            >
              <span className="w-[390px] flex items-start hover:bg-stone-800 hover:overflow-auto hover:z-10 hover:w-auto hover:absolute whitespace-nowrap overflow-ellipsis overflow-hidden">
                {project.name}
              </span>
              <div
                className="bg-cyan-300/60 h-px inline-block"
                style={{
                  width: `${(100 * rowSum(project.id)) / 172}%`,
                }}
              />
            </div>

            {/* Cells */}
            {daysInMonth.map((date, colIndex) => (
              <div
                key={`${project.id}-${date.toISOString()}`}
                id={`${project.id}-${date.toISOString()}`}
                className={cn(
                  'flex justify-center p-1  m-1/2 rounded-md border border-stone-600 select-none',
                  isSelected(project.id, colIndex) && 'border-white! shadow',
                  isMultiSelected() && 'border-dotted',
                  (isNationalHoliday(date) || isWeekend(date)) &&
                    'border-stone-700 text-stone-700',
                  // isToday(date) && 'bg-cyan-900',
                )}
                style={{
                  boxShadow: isSelected(project.id, colIndex)
                    ? '0 0 5px #fff'
                    : '',
                }}
                onMouseDown={() => {
                  setIsDragging(true);
                  setSelection({
                    start: { row: project.id, col: colIndex },
                    end: { row: project.id, col: colIndex },
                  });
                  setActiveCell({ row: project.id, col: colIndex });
                }}
                onMouseEnter={() => {
                  if (!isDragging || !selection) return;
                  setSelection((prev) =>
                    prev
                      ? { ...prev, end: { row: project.id, col: colIndex } }
                      : null,
                  );
                }}
              >
                <NumberInput
                  ref={(el) => {
                    if (!inputRefs.current[rowIndex]) {
                      inputRefs.current[rowIndex] = [];
                    }
                    inputRefs.current[rowIndex][colIndex] = el!;
                  }}
                  value={getValue(project.id, date)}
                  onChange={(v) => setValue(project.id, date, v)}
                  onFocus={() => onFocus(project.id, colIndex)}
                  onNavigate={(dir) => onNavigate(rowIndex, colIndex, dir)}
                  onSelectExtend={(dir) => onSelectExtend(dir)}
                  className="w-[26px] text-center border rounded border-none"
                  disabled={payzlipVerifiedDays?.includes(
                    format(date, 'yyyy-MM-dd') as PayzlipDate,
                  )}
                />
              </div>
            ))}

            {/* Row sum */}
            <div className="text-center font-semibold ms-2 pt-1.25 bg-stone-700 rounded-md">
              {rowSum(project.id)}
            </div>
          </>
        ))}

        {/* ===== Column sums ===== */}
        <div className="sticky left-0 z-10 font-semibold mt-3 flex flex-row justify-between pe-2 opacity-70">
          <Button
            size="sm"
            className="flex items-center justify-center gap-1 py-0.5 ms-2"
            disabled={
              !payzlipReportedDays?.length ||
              payzlipReportedDays.length === (payzlipVerifiedDays?.length || 0)
            }
            onClick={() => setVerifyDaysDialogOpen(true)}
          >
            <SealCheckIcon />
            Verify days
          </Button>
          <span className="mt-0.5">Σ</span>
        </div>

        {daysInMonth.map((date) => {
          const sum = columnSum(date);
          const reportedSum =
            reports[format(date, 'yyyy-MM-dd') as PayzlipDate]?.workedHours;
          return (
            <div
              key={`sum-${date.toISOString()}`}
              className={cn(
                'text-center font-semibold  px-2 py-1 bg-stone-600 rounded-md mt-2',
                !payzlipVerifiedDays?.includes(
                  format(date, 'yyyy-MM-dd') as PayzlipDate,
                ) &&
                  sum &&
                  'cursor-pointer',
                payzlipVerifiedDays?.includes(
                  format(date, 'yyyy-MM-dd') as PayzlipDate,
                )
                  ? 'border border-green-500 bg-green-700'
                  : reportedSum && reportedSum !== sum
                    ? 'border border-amber-600 bg-amber-950'
                    : payzlipReportedDays?.includes(
                        format(date, 'yyyy-MM-dd') as PayzlipDate,
                      ) && 'border border-green-600 bg-green-950',
                sum === 0
                  ? 'text-stone-400'
                  : sum >= 8
                    ? 'text-white'
                    : 'text-yellow-500',
              )}
              onClick={() => uploadDayToPayzlip(date)}
            >
              {uploadingDate === date.getDate() ? (
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
        })}

        {/* ===== Row sum all days ===== */}
        <div className="text-center font-semibold mt-2 ms-2 pt-1 bg-stone-700 border border-stone-500 rounded-md">
          {totalSum()}
        </div>
      </div>
    </div>
  );
};
