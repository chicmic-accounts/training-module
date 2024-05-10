export const COMMON_RESPONSE = (message: string, data: any, count?: number) => {
  return {
    message,
    success: true,
    data,
    count,
  };
};
