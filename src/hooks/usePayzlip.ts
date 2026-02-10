import { useEffect, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import dayjs from 'dayjs';
import { TokenState } from '../states/token.state';
import {
  PayzlipReportdState,
  PayzlipReportedDaysState,
  PayzlipVerifiedDaysState,
} from '../states/payzlip.state';
import { payzlipApi } from '../utils/payzlipApi.util';
import {
  type PayzlipReportResponse,
  type PayzlipDate,
  type ReportItem,
  type PayzlipReportUploadPayload,
} from '../types/project';

// const API_ROOT = 'https://api.payzlip.se';
const ISO_STRING = 'YYYY-MM-DDTHH:mm:ss.SSS';
const ORGANIZATION_ID = '4bde0415-bf48-4e0d-a83b-b880d3aa3163';
const USER_ID = '4bde0415-bf48-4e0d-a83b-b880d3aa3163';
// const CLIENT_ID = '5jofr8lhuof52fjs87m911k70e';

interface PayzlipJwt extends JwtPayload {
  sub?: string;
  scope?: string;
}

export const usePayzlip = () => {
  const { fetchAccessToken, apiGet, apiPost, apiPatch, apiDelete } =
    payzlipApi();
  const refreshToken = useAtomValue(TokenState);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<PayzlipJwt | null>(null);
  const [reports, setReports] = useAtom(PayzlipReportdState);
  const [payzlipReportedDays, setPayzlipReportedDays] = useAtom(
    PayzlipReportedDaysState,
  );
  const [payzlipVerifiedDays, setPayzlipVerifiedDays] = useAtom(
    PayzlipVerifiedDaysState,
  );

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
    const getToken = async () => {
      const token = await fetchAccessToken(refreshToken);
      setAccessToken(token);
      setDecoded(jwtDecode<PayzlipJwt>(token));
    };
    getToken();
    const interval = setInterval(getToken, 1800 * 1000);
    return () => clearInterval(interval);
  }, [refreshToken]);

  const getProjects = async () => {
    if (!accessToken) throw new Error('No access token');
    const ret = await apiGet(
      `/v1/organizations/${ORGANIZATION_ID}/client-settings`,
      accessToken,
    );

    return ret;
  };

  const getReports = async (
    start: Date,
    end: Date,
  ): Promise<PayzlipReportResponse> => {
    if (!accessToken) throw new Error('No access token');

    const query: Record<string, string> = {
      startDate: dayjs(start).startOf('day').format(ISO_STRING),
      endDate: dayjs(end || start).format(ISO_STRING),
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
    decoded,
    getProjects,
    getReports,
    payzlipReportedDays,
    payzlipVerifiedDays,
    verifyDays,
    reportHoursForDate,
    deleteReport,
  };
};
