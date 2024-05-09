export const COMMON_RESPONSE = (message: string, data: any) => {
  return {
    message,
    success: true,
    data,
  };
};
