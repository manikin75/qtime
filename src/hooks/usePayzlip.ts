import { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useQuery } from '@tanstack/react-query';

import dayjs from 'dayjs';
import { TokenState } from '../states/token.state';
import {
  PayzlipReportdState,
  PayzlipReportedDaysState,
  PayzlipVerifiedDaysState,
} from '../states/payzlip.state';
import { usePayzlipApi } from '../utils/payzlipApi.util';
import {
  type PayzlipReportResponse,
  type PayzlipDate,
  type ReportItem,
  type PayzlipReportUploadPayload,
  type Project,
} from '../types/project';
import { MyProjectsState } from '../states/myProjects.state';

const ISO_STRING = 'YYYY-MM-DDTHH:mm:ss.SSS';
const ORGANIZATION_ID = '4bde0415-bf48-4e0d-a83b-b880d3aa3163';
const USER_ID = '4bde0415-bf48-4e0d-a83b-b880d3aa3163';

export const usePayzlip = () => {
  const refreshToken = useAtomValue(TokenState);
  const {
    accessToken,
    refetchAccessToken,
    apiGet,
    apiPost,
    apiPatch,
    apiDelete,
  } = usePayzlipApi(refreshToken);
  const [reports, setReports] = useAtom(PayzlipReportdState);
  const [payzlipReportedDays, setPayzlipReportedDays] = useAtom(
    PayzlipReportedDaysState,
  );
  const [payzlipVerifiedDays, setPayzlipVerifiedDays] = useAtom(
    PayzlipVerifiedDaysState,
  );
  const [myProjects, setMyProjects] = useAtom(MyProjectsState);

  const serialize = (obj: Record<string, string>) => {
    const str: string[] = [];
    Object.keys(obj).forEach((key) => {
      str.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
    });
    return str.join('&');
  };

  useEffect(() => {
    if (!refreshToken) {
      return;
    }
    const interval = setInterval(refetchAccessToken, 1800 * 1000);
    return () => clearInterval(interval);
  }, [refetchAccessToken, refreshToken]);

  const getProjects = async () => {
    if (!accessToken) throw new Error('No access token');
    const ret = await apiGet(
      `/v1/organizations/${ORGANIZATION_ID}/client-settings`,
      accessToken,
    );

    return ret;
  };

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
    enabled: accessToken !== null,
  });

  const addMissingProjectsToMyProjects = async (
    reports: PayzlipReportResponse,
  ) => {
    const reportedProjects = new Set<string>();
    const allProjects = (await projects)?.projects;

    Object.values(reports).forEach((day) => {
      if (!day?.reports?.length) return;

      day.reports.forEach((report) => {
        if (report.projectId) {
          reportedProjects.add(report.projectId);
        }
      });
    });

    const missingProjects = [...reportedProjects].filter(
      (projectId) => !myProjects.some((p) => p.id === projectId),
    );

    const projectsToAdd = missingProjects
      .map((projectId) => {
        const project = allProjects?.find((p: Project) => p.id === projectId);
        if (!project) return null;
        return { ...project, id: projectId };
      })
      .filter(Boolean);
    setMyProjects((prev) => [...prev, ...projectsToAdd]);
  };

  const getReports = async (
    start: Date,
    end: Date,
  ): Promise<PayzlipReportResponse> => {
    if (!accessToken) throw new Error('No access token');

    const query: Record<string, string> = {
      startDate: dayjs(start).startOf('day').format(ISO_STRING),
      endDate: dayjs(end).endOf('month').format(ISO_STRING),
      lang: 'sv',
    };

    const ret: PayzlipReportResponse = await apiGet(
      `/v1/_/reporting/user/${USER_ID}/activities?${serialize(query)}`,
      accessToken,
    );

    setReports(ret);

    const datesWithReports = Object.entries(ret)
      .map(([date, reports]) => {
        return { date, reports };
      })
      .filter(({ reports }) => reports.reports.length > 0);
    setPayzlipReportedDays(
      datesWithReports.map((d) => d.date) as PayzlipDate[],
    );
    setPayzlipVerifiedDays(
      datesWithReports
        .filter((d) => d.reports.verified)
        .map((d) => d.date) as PayzlipDate[],
    );

    addMissingProjectsToMyProjects(ret);

    return ret;
  };

  const reportHoursForDate = async (date: Date, items: ReportItem[]) => {
    if (!accessToken) throw new Error('No access token');

    // const fixedReport = transformReport(date, projectId, hours);
    // if (!fixedReport) return;
    let start = 8;
    const itemsToUpload: PayzlipReportUploadPayload[] = [];
    items?.forEach((d) => {
      itemsToUpload.push({
        projectId: d.projectId,
        startTime: dayjs(date)
          .set('hour', start)
          .startOf('hour')
          .format(ISO_STRING),
        endTime: dayjs(date)
          .set('hour', start + d.hours)
          .startOf('hour')
          .format(ISO_STRING),
        comment: '',
        timeCode: 'normal',
      });
      start += d.hours;
    });

    const res = await apiPost(
      `/v1/_/reporting/user/${USER_ID}/presence/reports`,
      accessToken,
      { items: itemsToUpload },
    );

    console.log({ res });
    return;
  };

  const deleteReport = async (projectId: string, date: Date) => {
    if (!accessToken) throw new Error('No access token');
    const formattedDate = dayjs(date).format('YYYY-MM-DD');

    const dayReports = Object.entries(reports)?.filter(
      (d) => d[0] === formattedDate,
    )[0];
    if (!dayReports) return;
    const report = dayReports[1]?.reports.find(
      (rep) => rep.projectId === projectId,
    );
    if (!report) return;

    const res = await apiDelete(
      `/v1/_/reporting/user/${USER_ID}/presence/reports`,
      accessToken,
      { reportIds: [report.id] },
    );

    return res;
  };

  const verifyDays = async (dates: PayzlipDate[]) => {
    if (!accessToken) throw new Error('No access token');
    if (!dates || dates.length === 0) {
      throw new Error('Expected dates to verify');
    }

    const res = await apiPatch(
      `/v1/_/reporting/user/${USER_ID}/verify-days`,
      accessToken,
      { dates },
    );

    return res;
  };

  return {
    payzlipReady: accessToken !== null,
    projects,
    isLoadingProjects,
    getReports,
    reports,
    payzlipReportedDays,
    payzlipVerifiedDays,
    verifyDays,
    reportHoursForDate,
    deleteReport,
  };
};
