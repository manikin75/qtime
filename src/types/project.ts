type ProjectId = string | null;

type Project = {
  id: ProjectId;
  name: string;
  archived: boolean;
};

type PayzlipDate = `${number}-${number}-${number}`;
type PayzlipReport = {
  activity: string;
  attested: boolean;
  comment: string;
  date: PayzlipDate;
  endTime: string;
  errors: string[];
  granularity: string;
  hours: number;
  id: string;
  minutes: number;
  projectId: string;
  startTime: string;
  timeCode: string;
  timeCodeEffectId: string;
  totalHours: number;
  type: 'presence' | 'absence';
  verified: boolean;
};
type PayzlipReportDay = {
  reports: PayzlipReport[];
  absenceHours: number;
  workedHours: number;
  verified: boolean;
};
type PayzlipReportResponse = Record<PayzlipDate, PayzlipReportDay>;

type PayzlipReportUploadPayload = {
  projectId: string;
  startTime: string;
  endTime: string;
  comment: string;
  timeCode: 'normal';
};

type ReportItem = { projectId: string; hours: number };

export type {
  ProjectId,
  Project,
  PayzlipDate,
  PayzlipReport,
  PayzlipReportDay,
  PayzlipReportResponse,
  PayzlipReportUploadPayload,
  ReportItem,
};
