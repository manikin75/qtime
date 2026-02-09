import { useEffect, useState, useRef } from 'react';
import {
  useNationalHolidays,
  type NationalHoliday,
} from './useNationalHolidays';
import { format } from 'date-fns';
import { atomWithStorage } from 'jotai/utils';
import { useAtom } from 'jotai';
import { usePayzlip } from './usePayzlip';
import { type Project, type ProjectId } from '../types/project';
import type { Change, CellKey, CellPos, Direction } from '../types/cells';
import { type PayzlipReportDay } from '../types/project';

const CellValueAtom = atomWithStorage<Record<CellKey, number>>(
  'cellValues',
  {},
);
const ABSENCE_KEY = ['🤒', '👶', '🌴', '🤠', null] as const;
type AbsenceType = (typeof ABSENCE_KEY)[number];
type AbsenceValue = Exclude<AbsenceType, null>;
type AbsenceKey = `${number}_${number}_${number}`;
const AbsenceAtom = atomWithStorage<Record<AbsenceKey, AbsenceType>>(
  'absence',
  {},
);
export const ABSENCE_DESCRIPTION: Record<AbsenceValue, string> = {
  '🤒': 'Sick',
  '👶': 'VAB',
  '🌴': 'Vacay',
  '🤠': 'Unpaid',
};

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
  const [reportedDays, setReportedDays] = useState<
    Record<string, PayzlipReportDay>
  >({});
  const [values, setValues] = useAtom(CellValueAtom);
  const [absence, setAbsence] = useAtom(AbsenceAtom);
  const [activeCell, setActiveCell] = useState<CellPos | null>(null);
  const [nationalHolidays, setNationalHolidays] = useState<NationalHoliday[]>(
    [],
  );
  const { payzlipReady, getReports } = usePayzlip();
  const [selection, setSelection] = useState<{
    start: CellPos;
    end: CellPos;
  } | null>(null);
  const [shiftKey, setShiftKey] = useState(false);
  const inputRefs = useRef<
    HTMLInputElement[][] // [row][col]
  >([]);
  const clipboardRef = useRef<number[][]>([]);

  const undoStack = useRef<Change[][]>([]);
  const redoStack = useRef<Change[][]>([]);

  const getValue = (projectId: string, date: Date) =>
    values[`${projectId}_${date.toDateString()}`] ?? 0;

  const setValue = (projectId: string, date: Date, value: number) => {
    const key: CellKey = `${projectId}_${date.toDateString()}`;
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!payzlipReady) return;
    const reports = async () => {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      const r = await getReports(start, end > new Date() ? new Date() : end);
      setReportedDays(r);
    };
    // Populate projects from server
    reports();
  }, [payzlipReady, year, month]);

  useEffect(() => {
    if (!payzlipReady || !reportedDays) return;
    Object.entries(reportedDays).forEach(([date, day]) => {
      if (!day?.reports.length) return;
      console.log(date, day);
      const d = new Date(date);
      day?.reports.forEach((report) => {
        console.log('setting', report.projectId, d, report.hours);
        setValue(report.projectId, d, report.hours);
      });
    });
  }, [payzlipReady, reportedDays]);

  const rowSum = (projectId: string) =>
    daysInMonth.reduce((sum, d) => sum + getValue(projectId, d), 0);

  const columnSum = (date: Date) =>
    projects.reduce((sum, p) => sum + getValue(p.id, date), 0);

  const totalSum = () => projects.reduce((sum, p) => sum + rowSum(p.id), 0);

  const projectIdToRow = (projectId: ProjectId) =>
    projects.findIndex((p) => p.id === projectId);

  const isSelected = (row: ProjectId, col: number) => {
    if (!selection) return false;

    const r1 = Math.min(
      projectIdToRow(selection.start.row),
      projectIdToRow(selection.end.row),
    );
    const r2 = Math.max(
      projectIdToRow(selection.start.row),
      projectIdToRow(selection.end.row),
    );
    const c1 = Math.min(selection.start.col, selection.end.col);
    const c2 = Math.max(selection.start.col, selection.end.col);

    return (
      projectIdToRow(row) >= r1 &&
      projectIdToRow(row) <= r2 &&
      col >= c1 &&
      col <= c2
    );
  };

  const isMultiSelected = () => {
    if (!selection) return false;
    return (
      selection.start.row !== selection.end.row ||
      selection.start.col !== selection.end.col
    );
  };

  const getDaysInMonth = () => {
    const days: Date[] = [];

    const numberOfDays = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= numberOfDays; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };
  const daysInMonth: Date[] = getDaysInMonth();

  // Stack handling (undo/redo)
  const applyChanges = (changes: Change[]) => {
    changes.forEach(({ row, col, next }) => {
      setValue(projects[projectIdToRow(row)].id, daysInMonth[col], next);
    });
  };

  const recordChanges = (changes: Change[]) => {
    undoStack.current.push(changes);
    redoStack.current = [];
  };

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

    const r1 = Math.min(
      projectIdToRow(selection.start.row),
      projectIdToRow(selection.end.row),
    );
    const r2 = Math.max(
      projectIdToRow(selection.start.row),
      projectIdToRow(selection.end.row),
    );
    const c1 = Math.min(selection.start.col, selection.end.col);
    const c2 = Math.max(selection.start.col, selection.end.col);

    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        cb(r, c);
      }
    }
  };

  const getAbsenceKey = (
    year: number,
    month: number,
    col: number,
  ): AbsenceKey => `${year}_${month}_${col}`;

  const nextAbsence = (current: AbsenceType | null): AbsenceType => {
    if (!current) return ABSENCE_KEY[0];
    const idx = ABSENCE_KEY.indexOf(current);
    return ABSENCE_KEY[(idx + 1) % ABSENCE_KEY.length];
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      setShiftKey(e.shiftKey);
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (!selection) return;

        const r1 = Math.min(
          projectIdToRow(selection.start.row),
          projectIdToRow(selection.end.row),
        );
        const r2 = Math.max(
          projectIdToRow(selection.start.row),
          projectIdToRow(selection.end.row),
        );
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

        const changes: Change[] = [];
        data.forEach((row, rOffset) => {
          row.forEach((value, cOffset) => {
            const r = projectIdToRow(activeCell.row) + rOffset;
            const c = activeCell.col + cOffset;

            if (r < projects.length && c < daysInMonth.length) {
              // setValue(projects[r].id, daysInMonth[c], value);
              changes.push({
                row: projects[r].id,
                col: c,
                prev: getValue(projects[r].id, daysInMonth[c]),
                next: value,
              });
            }
          });
        });
        applyChanges(changes);
        recordChanges(changes);
        return false;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!selection && !activeCell) return;
        e.preventDefault();

        const changes: Change[] = [];
        forEachSelectedCell((r, c) => {
          // setValue(projects[r].id, daysInMonth[c], 0);
          changes.push({
            row: projects[r].id,
            col: c,
            prev: getValue(projects[r].id, daysInMonth[c]),
            next: 0,
          });
        });
        applyChanges(changes);
        recordChanges(changes);
      }

      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.key.match(/^[0-9]$/)) {
        const value = parseInt(e.key);
        if (!activeCell || !selection || !isMultiSelected() || value > 9)
          return;
        e.preventDefault();

        const changes: Change[] = [];
        forEachSelectedCell((r, c) => {
          // setValue(projects[r].id, daysInMonth[c], value);
          changes.push({
            row: projects[r].id,
            col: c,
            prev: getValue(projects[r].id, daysInMonth[c]),
            next: value,
          });
        });
        applyChanges(changes);
        recordChanges(changes);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();

        const last = undoStack.current.pop();
        if (!last) return;

        last.forEach(({ row, col, prev }) => {
          setValue(projects[projectIdToRow(row)].id, daysInMonth[col], prev);
        });

        redoStack.current.push(last);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();

        if (!activeCell) return;

        const baseKey = getAbsenceKey(year, month, activeCell.col + 1);
        const current = absence[baseKey] ?? null;
        const valueToApply = nextAbsence(current);

        if (valueToApply === null) {
          setAbsence((prev) => {
            const next = { ...prev };
            forEachSelectedCell((_, col) => {
              const key = getAbsenceKey(year, month, col + 1);
              delete next[key];
            });
            return next;
          });
          return;
        }

        setAbsence((prev) => {
          const next = { ...prev };

          forEachSelectedCell((_, col) => {
            const key = getAbsenceKey(year, month, col + 1);
            next[key] = valueToApply;
          });

          return next;
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
  }, [clipboardRef]);

  const onFocus = (projectId: ProjectId, colIndex: number) => {
    setActiveCell({ row: projectId, col: colIndex });
    if (!shiftKey) {
      setSelection({
        start: { row: projectId, col: colIndex },
        end: { row: projectId, col: colIndex },
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
      row: projectIdToRow(selection.end.row) + delta.r,
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

    const newEnd = { row: projects[next.row].id, col: next.col };

    setSelection((prev) =>
      prev
        ? { ...prev, end: newEnd }
        : {
            start: newEnd,
            end: newEnd,
          },
    );

    inputRefs.current[next.row]?.[next.col]?.focus();
  };

  const onActivate = (projectId: string, colIndex: number) => {
    setActiveCell({ row: projectId, col: colIndex });
    setSelection({
      start: { row: projectId, col: colIndex },
      end: { row: projectId, col: colIndex },
    });
  };

  return {
    inputRefs,
    activeCell,
    setActiveCell,
    setValue,
    getValue,
    absence,
    setAbsence,
    rowSum,
    columnSum,
    totalSum,
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
    getAbsenceKey,
  };
};
