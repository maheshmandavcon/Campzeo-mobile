import "dotenv/config";

export default ({ config }) => {
  return {
    ...config,
    scheme: "campzeo",
    extra: {
      ...config.extra,
      mobileApiKey:
        process.env.EXPO_PUBLIC_MOBILE_API_KEY || config.extra?.mobileApiKey,
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL || config.extra?.apiBaseUrl,
    },
  };
};
