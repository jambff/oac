import { AxiosResponse } from 'axios';

export const createUpgradeRequiredInterceptor = (
  onUpgradeRequired?: () => void,
) => ({
  success: (res: AxiosResponse) => res,
  error: (error: any) => {
    const { response, statusCode } = error;
    const { status } = response ?? {};

    if ([statusCode, status].includes(406) && onUpgradeRequired) {
      onUpgradeRequired();
    }

    return Promise.reject(error);
  },
});
