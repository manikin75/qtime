const API_ROOT = 'https://api.payzlip.se';
const CLIENT_ID = '5jofr8lhuof52fjs87m911k70e';

const payzlipApi = () => {
  const fetchAccessToken = async (refreshToken: string) => {
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

  const apiFetch = async <TData extends object | undefined>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    accessToken: string,
    data?: TData,
  ) => {
    const res = await fetch(API_ROOT + endpoint, {
      method,
      headers: {
        authorization: 'Bearer ' + accessToken,
        'content-type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const body = await res.text();
    if (res.status >= 300) {
      console.error(body);
      throw new Error('Request failed');
    }

    if (method === 'PATCH') {
      return res.status;
    }

    return JSON.parse(body);
  };

  const apiGet = async (endpoint: string, accessToken: string) =>
    apiFetch(endpoint, 'GET', accessToken);
  const apiPost = async <TData extends object | undefined>(
    endpoint: string,
    accessToken: string,
    data?: TData,
  ) => apiFetch(endpoint, 'POST', accessToken, data);
  const apiPatch = async <TData extends object | undefined>(
    endpoint: string,
    accessToken: string,
    data?: TData,
  ) => apiFetch(endpoint, 'PATCH', accessToken, data);
  const apiDelete = async <TData extends object | undefined>(
    endpoint: string,
    accessToken: string,
    data?: TData,
  ) => apiFetch(endpoint, 'DELETE', accessToken, data);

  return {
    fetchAccessToken,
    apiGet,
    apiPost,
    apiPatch,
    apiDelete,
  };
};

export { payzlipApi };
