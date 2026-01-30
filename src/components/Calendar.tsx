import { useState, useEffect } from 'react';
import { cn } from '@sglara/cn';
import { format, isToday, isWeekend } from 'date-fns';
import { NumberInput } from './NumberInput';
import { useCalendar } from '../hooks/useCalendar';
import { type Project } from '../types/project';
import { type NationalHoliday } from '../hooks/useNationalHolidays';

export const Calendar = ({
  year,
  month,
  projects,
}: {
  year: number;
  month: number;
  projects: Project[];
}) => {
  const [tooltip, setTooltip] = useState<NationalHoliday | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    inputRefs,
    activeCell,
    setActiveCell,
    setValue,
    getValue,
    rowSum,
    columnSum,
    isSelected,
    daysInMonth,
    onFocus,
    onNavigate,
    onSelectExtend,
    onActivate,
    selection,
    setSelection,
    isMultiSelected,
    nationalHolidays,
    isNationalHoliday,
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

  return (
    <div className="mx-10 my-10 overflow-x-auto">
      <div
        className="grid gap-1 text-sm"
        style={{
          gridTemplateColumns: `200px repeat(${daysInMonth.length}, 28px) 64px`,
        }}
      >
        {/* ===== Header row ===== */}
        <div className="sticky left-0  z-20" />

        {daysInMonth.map((date) => (
          <div
            key={date.toISOString()}
            className={cn(
              'flex flex-col items-center px-4 gap-1 mb-2 border-b border-slate-600 py-1 relative',
              isNationalHoliday(date) && 'text-red-500 cursor-pointer',
              isWeekend(date) && 'text-red-500',
              isToday(date) && 'bg-cyan-700 rounded',
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

        <div className="font-semibold text-right pr-2 mt-6">Σ</div>

        {/* ===== Project rows ===== */}
        {projects.map((project, rowIndex) => (
          <>
            {/* Project name (sticky) */}
            <div
              key={project.id}
              className={cn(
                'sticky left-0 bg-cyan-950 z-10 flex items-center font-medium rounded-sm ps-2',
                activeCell?.row === rowIndex && 'bg-cyan-800',
              )}
            >
              {project.name}
            </div>

            {/* Cells */}
            {daysInMonth.map((date, colIndex) => (
              <div
                key={`${project.id}-${date.toISOString()}`}
                className={cn(
                  'flex justify-center px-0 rounded-sm border-2 border-transparent hover:border-cyan-600 select-none',
                  isSelected(rowIndex, colIndex) &&
                    'border-cyan-700! bg-cyan-950',
                  isMultiSelected() && 'border-dotted',
                  isNationalHoliday(date) && 'bg-slate-900 text-slate-500',
                  isWeekend(date) && 'bg-slate-900 text-slate-500',
                  isToday(date) && 'bg-cyan-800',
                )}
                onMouseDown={() => {
                  setIsDragging(true);
                  setSelection({
                    start: { row: rowIndex, col: colIndex },
                    end: { row: rowIndex, col: colIndex },
                  });
                  setActiveCell({ row: rowIndex, col: colIndex });
                }}
                onMouseEnter={() => {
                  if (!isDragging || !selection) return;
                  setSelection((prev) =>
                    prev
                      ? { ...prev, end: { row: rowIndex, col: colIndex } }
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
                  onFocus={() => onFocus(rowIndex, colIndex)}
                  onNavigate={(dir) => onNavigate(rowIndex, colIndex, dir)}
                  onSelectExtend={(dir) => onSelectExtend(dir)}
                  onActivate={() => onActivate(rowIndex, colIndex)}
                  className="w-[26px] text-center border rounded border-none"
                />
              </div>
            ))}

            {/* Row sum */}
            <div className="text-right font-semibold pr-2">
              {rowSum(project.id)}
            </div>
          </>
        ))}

        {/* ===== Column sums ===== */}
        <div className="sticky left-0 z-10 font-semibold mt-2">Σ</div>

        {daysInMonth.map((date) => {
          const sum = columnSum(date);
          return (
            <div
              key={`sum-${date.toISOString()}`}
              className={[
                'text-center font-semibold  px-2 border-t border-slate-600 mt-2',
                sum === 0
                  ? 'text-slate-600'
                  : sum >= 8
                    ? 'text-green-600'
                    : 'text-yellow-600',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {sum || '-'}
            </div>
          );
        })}

        <div />
      </div>
    </div>
  );
};
