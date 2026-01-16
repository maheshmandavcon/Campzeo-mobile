import "dotenv/config";

export default ({ config }) => {
  return {
    ...config,

    // ✅ REQUIRED for Clerk OAuth redirects
    scheme: "campzeo", // 👈 can be any unique name (use your app name)
    // campzeo://auth-callback
    extra: {
      ...config.extra, 
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || config.extra?.clerkPublishableKey,
      mobileApiKey: process.env.EXPO_PUBLIC_MOBILE_API_KEY || config.extra?.mobileApiKey,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || config.extra?.apiBaseUrl,
    },
  };
};
