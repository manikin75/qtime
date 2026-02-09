import { atom } from 'jotai';
import { type PayzlipDate } from '../types/project';

export const PayzlipReportedDaysState = atom<PayzlipDate[] | null>(null);
export const PayzlipVerifiedDaysState = atom<PayzlipDate[] | null>(null);
