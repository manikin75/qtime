import { atomWithStorage } from 'jotai/utils';

export const TokenState = atomWithStorage<string | null>('payzlipToken', null);
