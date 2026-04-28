import axios, { AxiosInstance } from 'axios';
import { getSession } from 'next-auth/react';

type ApiInstance = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> & {
  get<T = any>(url: string, config?: object): Promise<T>;
  post<T = any>(url: string, data?: unknown, config?: object): Promise<T>;
  put<T = any>(url: string, data?: unknown, config?: object): Promise<T>;
  patch<T = any>(url: string, data?: unknown, config?: object): Promise<T>;
  delete<T = any>(url: string, config?: object): Promise<T>;
};

const _api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
});

_api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

_api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data ?? err),
);

export default _api as unknown as ApiInstance;
