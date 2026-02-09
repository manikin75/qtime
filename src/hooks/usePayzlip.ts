import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import dayjs from 'dayjs';
import { TokenState } from '../states/token.state';
import { type PayzlipReportResponse } from '../types/project';

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

    return JSON.parse(body);
  };

  return {
    payzlipReady: accessToken !== null,
    decoded,
    getProjects,
    getReports,
  };
};
