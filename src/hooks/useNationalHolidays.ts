// Data from https://tallyfy.com/national-holidays/
import { useRef, useCallback } from 'react';

export type NationalHoliday = {
  date: string;
  name: string;
  local_name: string;
  type: 'national' | 'bank';
  observed_date: string;
  is_observed_shifted: boolean;
  description: string;
};

type HolidaysJson = {
  country: {
    code: string;
    code3: string;
    name: string;
  };
  year: number;
  holidays: NationalHoliday[];
};

export const useNationalHolidays = () => {
  const cache = useRef<Record<number, NationalHoliday[]>>({});

  const getForYear = useCallback(async (year: number) => {
    if (cache.current[year]) return cache.current[year];

    try {
      const res = await fetch(`/national-holidays/${year}.json`);
      if (!res.ok) throw new Error(`Failed to load ${year}`);
      const data: HolidaysJson = await res.json();
      cache.current[year] = data.holidays;
      return data.holidays;
    } catch (err) {
      console.error(err);
      return [];
    }
  }, []);

  return { getForYear };
};
