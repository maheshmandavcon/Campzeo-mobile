import https from "./https";


// https://camp-zeo-testing-git-testing-mandav-consultancy.vercel.app/api/Analytics/posts?platform=EMAIL&page=1&limit=10
// export const getLogs= async (platform: string) => {
//   try {
//     const response = await https.get(`Analytics/posts?platform=${platform}`);    

//     // console.log("logs details: ",response.data);

//     return response.data;
//   } catch (error) {
//     console.error("Fetching platform Error:", error);
//     throw error;
//   }
// };

type GetLogsParams = {
  platform: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
};

export const getLogs = async ({
  platform,
  page = 1,
  limit = 10,
  startDate,
  endDate,
}: GetLogsParams) => {
  const params = new URLSearchParams();

  params.append("platform", platform);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  // console.log("LOGS QUERY →", params.toString());

  const response = await https.get(
    `Analytics/posts?${params.toString()}`
  );

  // console.log("response of platform details", response);
  return response.data;
};



// To refresh post details if updated
export const getRefreshLog = async (platform: string) => {
  // platform
  try {
    const response = await https.get(`Analytics/posts?platform=${platform}&fresh=true`);

    // console.log("Refreshed logs details: ",response.data);
    return response.data;
  } catch (error) {
    console.error("Fetching platform Error:", error);
    throw error;
  }
};

// Analytics Page api
export const getAnalytics = async (postId: number) => {
  try {
    const response = await https.get(`Analytics/post-details/${postId}?fresh=true`);
    return response.data;
  }
  catch (error) {
    console.error("Fetching platform Error:", error);
    throw error;
  }
};



