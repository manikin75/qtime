import { atom } from 'jotai';
import type {
  PayzlipDate,
  PayzlipReportDay,
  // PayzlipReportResponse,
} from '../types/project';

export const PayzlipReportdState = atom<Record<PayzlipDate, PayzlipReportDay>>(
  {},
);
export const PayzlipReportedDaysState = atom<PayzlipDate[]>([]);
export const PayzlipVerifiedDaysState = atom<PayzlipDate[]>([]);
