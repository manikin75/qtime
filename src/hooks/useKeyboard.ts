import { useEffect, useState, useRef } from 'react';
import { useCalendar } from './useCalendar';
import { type Project } from '../types/project';
import type { Change } from '../types/cells';

export const useKeyboard = (
  year: number,
  month: number,
  projects: Project[],
) => {
  const {
    projectIdToRow,
    applyChanges,
    recordChanges,
    forEachSelectedCell,
    nextAbsence,
    activeCell,
    setValue,
    getValue,
    absence,
    setAbsence,
    daysInMonth,
    selection,
    isMultiSelected,
    getAbsenceKey,
  } = useCalendar({ year, month, projects });

  const [shiftKey, setShiftKey] = useState(false);
  const clipboardRef = useRef<number[][]>([]);

  const undoStack = useRef<Change[][]>([]);
  const redoStack = useRef<Change[][]>([]);

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

  return {
    shiftKey,
    clipboardRef,
  };
};
