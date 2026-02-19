import { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
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
import { MyProjectsState, DefaultProject } from '../states/myProjects.state';

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
    let ret;
    try {
      ret = await apiGet(
        `/v1/organizations/${ORGANIZATION_ID}/client-settings`,
        accessToken,
      );
    } catch (e) {
      console.log(e);
      toast.error('Failed to get projects from payzlip');
      return;
    }

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

    if (!myProjects.find((p) => p.id === null)) {
      // Default project ("Ordinarie arbetstid") must be first
      projectsToAdd.unshift(DefaultProject);
    }

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

    let ret: PayzlipReportResponse;
    try {
      ret = await apiGet(
        `/v1/_/reporting/user/${USER_ID}/activities?${serialize(query)}`,
        accessToken,
      );
    } catch (e) {
      console.log(e);
      toast.error('Failed to get reports from payzlip');
      throw e;
    }
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
    let start = dayjs(date).set('hour', 8).startOf('hour');
    const itemsToUpload: PayzlipReportUploadPayload[] = [];
    items?.forEach((d) => {
      itemsToUpload.push({
        projectId: d.projectId,
        startTime: start.format(ISO_STRING),
        endTime: start.add(d.hours, 'hour').format(ISO_STRING),
        comment: '',
        timeCode: 'normal',
      });
      start = start.add(d.hours, 'hour');
    });

    try {
      const res = await apiPost(
        `/v1/_/reporting/user/${USER_ID}/presence/reports`,
        accessToken,
        { items: itemsToUpload },
      );
      console.log({ res });
      toast.success('Reported hours to payzlip');
    } catch (e) {
      console.log(e);
      toast.error('Failed to send report to payzlip');
    }

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

    try {
      await apiDelete(
        `/v1/_/reporting/user/${USER_ID}/presence/reports`,
        accessToken,
        { reportIds: [report.id] },
      );
    } catch (e) {
      console.log(e);
      toast.error('Failed to delete report from payzlip');
    }
  };

  const verifyDays = async (dates: PayzlipDate[]) => {
    if (!accessToken) throw new Error('No access token');
    if (!dates || dates.length === 0) {
      throw new Error('Expected dates to verify');
    }

    let res = 500;
    try {
      res = await apiPatch(
        `/v1/_/reporting/user/${USER_ID}/verify-days`,
        accessToken,
        { dates },
      );
      toast.success('Verified days on payzlip');
    } catch (e) {
      console.log(e);
      toast.error('Failed to verify days on payzlip');
    }
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
