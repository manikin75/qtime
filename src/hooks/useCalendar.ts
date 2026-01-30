import { useEffect, useMemo, useState, useRef } from 'react';
import {
  useNationalHolidays,
  type NationalHoliday,
} from './useNationalHolidays';
import { format } from 'date-fns';
import { type Project } from '../types/project';

type CellKey = `${string}_${string}`; // projectId_date
type CellPos = {
  row: number;
  col: number;
};
type Direction = 'up' | 'down' | 'left' | 'right';

export const useCalendar = ({
  year,
  month,
  projects,
}: {
  year: number;
  month: number;
  projects: Project[];
}) => {
  const { getForYear } = useNationalHolidays();
  const [values, setValues] = useState<Record<CellKey, number>>({});
  const [activeCell, setActiveCell] = useState<CellPos | null>(null);
  const [nationalHolidays, setNationalHolidays] = useState<NationalHoliday[]>(
    [],
  );
  const [selection, setSelection] = useState<{
    start: CellPos;
    end: CellPos;
  } | null>(null);
  const [shiftKey, setShiftKey] = useState(false);
  const inputRefs = useRef<
    HTMLInputElement[][] // [row][col]
  >([]);
  const clipboardRef = useRef<number[][]>([]);

  const daysInMonth = useMemo(() => {
    const days: Date[] = [];

    // Antal dagar i månaden (JS-tricket: dag 0 i nästa månad)
    const numberOfDays = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= numberOfDays; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month]);

  useEffect(() => {
    let mounted = true;

    getForYear(year).then((holidays) => {
      if (mounted) setNationalHolidays(holidays);
    });

    return () => {
      mounted = false;
    };
  }, [year, getForYear]);

  // Helpers
  const isNationalHoliday = (date: Date) => {
    const d = format(date, 'yyyy-MM-dd');
    return nationalHolidays.some((h) => h.date === d);
  };

  const forEachSelectedCell = (cb: (row: number, col: number) => void) => {
    if (!selection) return;

    const r1 = Math.min(selection.start.row, selection.end.row);
    const r2 = Math.max(selection.start.row, selection.end.row);
    const c1 = Math.min(selection.start.col, selection.end.col);
    const c2 = Math.max(selection.start.col, selection.end.col);

    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        cb(r, c);
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      setShiftKey(e.shiftKey);
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (!selection) return;

        const r1 = Math.min(selection.start.row, selection.end.row);
        const r2 = Math.max(selection.start.row, selection.end.row);
        const c1 = Math.min(selection.start.col, selection.end.col);
        const c2 = Math.max(selection.start.col, selection.end.col);

        clipboardRef.current = [];

        for (let r = r1; r <= r2; r++) {
          const row: number[] = [];
          for (let c = c1; c <= c2; c++) {
            row.push(getValue(projects[r].id, daysInMonth[c]));
          }
          clipboardRef.current.push(row);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (!activeCell) return;

        const data = clipboardRef.current;
        if (!data.length) return;

        e.preventDefault();
        e.stopPropagation();

        data.forEach((row, rOffset) => {
          row.forEach((value, cOffset) => {
            const r = activeCell.row + rOffset;
            const c = activeCell.col + cOffset;

            if (r < projects.length && c < daysInMonth.length) {
              setValue(projects[r].id, daysInMonth[c], value);
            }
          });
        });
        return false;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!selection && !activeCell) return;
        e.preventDefault();

        forEachSelectedCell((r, c) => {
          setValue(projects[r].id, daysInMonth[c], 0);
        });
      }

      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.key.match(/^[0-9]$/)) {
        const value = parseInt(e.key);
        if (!activeCell || !selection || !isMultiSelected()) return;

        forEachSelectedCell((r, c) => {
          setValue(projects[r].id, daysInMonth[c], value);
        });
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey) {
        setShiftKey(false);
        // setSelection(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selection, daysInMonth, projects]);

  useEffect(() => {
    if (!clipboardRef.current) return;
    console.log(clipboardRef.current);
  }, [clipboardRef.current]);

  useEffect(() => {
    console.log({ shiftKey, selection });
  }, [shiftKey, selection]);

  const setValue = (projectId: string, date: Date, value: number) => {
    const key: CellKey = `${projectId}_${date.toDateString()}`;
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const getValue = (projectId: string, date: Date) =>
    values[`${projectId}_${date.toDateString()}`] ?? 0;

  const rowSum = (projectId: string) =>
    daysInMonth.reduce((sum, d) => sum + getValue(projectId, d), 0);

  const columnSum = (date: Date) =>
    projects.reduce((sum, p) => sum + getValue(p.id, date), 0);

  const isSelected = (row: number, col: number) => {
    if (!selection) return false;

    const r1 = Math.min(selection.start.row, selection.end.row);
    const r2 = Math.max(selection.start.row, selection.end.row);
    const c1 = Math.min(selection.start.col, selection.end.col);
    const c2 = Math.max(selection.start.col, selection.end.col);

    return row >= r1 && row <= r2 && col >= c1 && col <= c2;
  };

  const isMultiSelected = () => {
    if (!selection) return false;
    return (
      selection.start.row !== selection.end.row ||
      selection.start.col !== selection.end.col
    );
  };

  const onFocus = (rowIndex: number, colIndex: number) => {
    setActiveCell({ row: rowIndex, col: colIndex });
    if (!shiftKey) {
      setSelection({
        start: { row: rowIndex, col: colIndex },
        end: { row: rowIndex, col: colIndex },
      });
    }
  };

  const onNavigate = (rowIndex: number, colIndex: number, dir: Direction) => {
    const target = {
      up: inputRefs.current[rowIndex - 1]?.[colIndex],
      down: inputRefs.current[rowIndex + 1]?.[colIndex],
      left: inputRefs.current[rowIndex]?.[colIndex - 1],
      right: inputRefs.current[rowIndex]?.[colIndex + 1],
    }[dir];

    target?.focus();
  };

  const onSelectExtend = (dir: Direction) => {
    if (!selection) return;

    const delta = {
      up: { r: -1, c: 0 },
      down: { r: 1, c: 0 },
      left: { r: 0, c: -1 },
      right: { r: 0, c: 1 },
    }[dir];

    const next = {
      row: selection.end.row + delta.r,
      col: selection.end.col + delta.c,
    };

    // bounds check
    if (
      next.row < 0 ||
      next.col < 0 ||
      next.row >= projects.length ||
      next.col >= daysInMonth.length
    ) {
      return;
    }

    setSelection((prev) =>
      prev
        ? { ...prev, end: next }
        : {
            start: next,
            end: next,
          },
    );

    inputRefs.current[next.row]?.[next.col]?.focus();
  };

  const onActivate = (rowIndex: number, colIndex: number) => {
    setActiveCell({ row: rowIndex, col: colIndex });
    setSelection({
      start: { row: rowIndex, col: colIndex },
      end: { row: rowIndex, col: colIndex },
    });
  };

  return {
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
  };
};
