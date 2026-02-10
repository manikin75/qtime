import { atom } from 'jotai';
import type {
  PayzlipDate,
  PayzlipReportDay,
  // PayzlipReportResponse,
} from '../types/project';

export const PayzlipReportdState = atom<Record<
  PayzlipDate,
  PayzlipReportDay
> | null>(null);
export const PayzlipReportedDaysState = atom<PayzlipDate[] | null>(null);
export const PayzlipVerifiedDaysState = atom<PayzlipDate[] | null>(null);
