import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  useNationalHolidays,
  type NationalHoliday,
} from './useNationalHolidays';
import { CellValueAtom } from './useCalendar';

export const useYearlySummary = ({ year }: { year: number }) => {
  const { getForYear } = useNationalHolidays();
  const values = useAtomValue(CellValueAtom);
  // const [absence, setAbsence] = useAtom(AbsenceAtom);
  const [nationalHolidays, setNationalHolidays] = useState<NationalHoliday[]>(
    [],
  );
  useEffect(() => {
    getForYear(year).then((holidays) => {
      setNationalHolidays(holidays);
    });
  }, [year, getForYear]);
  return { nationalHolidays, values };
};
