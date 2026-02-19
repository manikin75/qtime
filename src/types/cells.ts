import { type ProjectId } from './project';

type Change = {
  row: ProjectId;
  col: number;
  prev: number;
  next: number;
};

type CellKey = `${ProjectId}_${string}`; // projectId_date
type CellPos = {
  row: ProjectId;
  col: number;
};
type Direction = 'up' | 'down' | 'left' | 'right';

type CellRow = ProjectId;
type CellCol = number;

export type { Change, CellKey, CellPos, Direction, CellCol, CellRow };
