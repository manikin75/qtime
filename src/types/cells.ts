type Change = {
  row: number;
  col: number;
  prev: number;
  next: number;
};

type CellKey = `${string}_${string}`; // projectId_date
type CellPos = {
  row: number;
  col: number;
};
type Direction = 'up' | 'down' | 'left' | 'right';

export type { Change, CellKey, CellPos, Direction };
