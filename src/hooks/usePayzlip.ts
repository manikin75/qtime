import { useEffect, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import dayjs from 'dayjs';
import { TokenState } from '../states/token.state';
import {
  PayzlipReportedDaysState,
  PayzlipVerifiedDaysState,
} from '../states/payzlip.state';
import { type PayzlipReportResponse, type PayzlipDate } from '../types/project';

const API_ROOT = 'https://api.payzlip.se';
const ISO_STRING = 'YYYY-MM-DDTHH:mm:ss.SSS';
const ORGANIZATION_ID = '4bde0415-bf48-4e0d-a83b-b880d3aa3163';
const USER_ID = '4bde0415-bf48-4e0d-a83b-b880d3aa3163';
const CLIENT_ID = '5jofr8lhuof52fjs87m911k70e';

// type State = string | JwtPayload | null;
interface PayzlipJwt extends JwtPayload {
  sub?: string;
  scope?: string;
}

export const usePayzlip = () => {
  const refreshToken = useAtomValue(TokenState);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<PayzlipJwt | null>(null);
  const [payzlipReportedDays, setPayzlipReportedDays] = useAtom(
    PayzlipReportedDaysState,
  );
  const [payzlipVerifiedDays, setPayzlipVerifiedDays] = useAtom(
    PayzlipVerifiedDaysState,
  );

  const fetchAccessToken = async () => {
    const res = await fetch(API_ROOT + '/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        clientId: CLIENT_ID,
        refreshToken,
      }),
    });

    const body = await res.text();
    if (res.status >= 300) {
      console.error(body);
      throw new Error('Request failed');
    }

    return JSON.parse(body).accessToken;
  };

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
    (async () => {
      const token = await fetchAccessToken();
      setAccessToken(token);
      setDecoded(jwtDecode<PayzlipJwt>(token));
    })();
  }, [refreshToken]);

  const getProjects = async () => {
    const res = await fetch(
      API_ROOT + `/v1/organizations/${ORGANIZATION_ID}/client-settings`,
      {
        headers: {
          authorization: 'Bearer ' + accessToken,
        },
      },
    );

    const body = await res.text();
    if (res.status >= 300) {
      console.error(body);
      throw new Error('Request failed');
    }

    return JSON.parse(body).projects;
  };

  const getReports = async (
    start: Date,
    end: Date,
  ): Promise<PayzlipReportResponse> => {
    const query = {
      startDate: dayjs(start).startOf('day').format(ISO_STRING),
      endDate: dayjs(end || start).format(ISO_STRING),
      lang: 'sv',
    };

    const endpoint = `/v1/_/reporting/user/${USER_ID}/activities?${serialize(query)}`;
    const res = await fetch(API_ROOT + endpoint, {
      headers: {
        authorization: 'Bearer ' + accessToken,
      },
    });

    const body = await res.text();
    if (res.status >= 300) {
      console.error(body);
      throw new Error('Request failed');
    }

    const ret = (await JSON.parse(body)) as PayzlipReportResponse;

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

  const verifyDays = async (dates: PayzlipDate[]) => {
    if (!dates || dates.length === 0) {
      throw new Error('Expected dates to verify');
    }

    const res = await fetch(
      API_ROOT + `/v1/_/reporting/user/${USER_ID}/verify-days`,
      {
        method: 'PATCH',
        headers: {
          authorization: 'Bearer ' + accessToken,
          'content-type': 'application/json',
        },

        body: JSON.stringify({ dates }),
      },
    );

    const body = await res.text();
    if (res.status >= 300) {
      console.error(body);
      throw new Error('Request failed');
    }

    try {
      const d = JSON.parse(body);
      return d;
    } catch (err) {
      console.error(body);
      throw err;
    }
  };

  return {
    payzlipReady: accessToken !== null,
    decoded,
    getProjects,
    getReports,
    payzlipReportedDays,
    payzlipVerifiedDays,
    verifyDays,
  };
};
