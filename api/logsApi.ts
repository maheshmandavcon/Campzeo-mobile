import https from "./https";

export const getLogs= async (platform: string) => {
  try {
    const response = await https.get(`Analytics/posts?platform=${platform}`);    

    // console.log("logs details: ",response.data);
    
    return response.data;
  } catch (error) {
    console.error("Fetching platform Error:", error);
    throw error;
  }
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



