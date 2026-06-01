import https from "./https";

export const getUser = async () => {
  try {
    const response = await https.get(`user/me`);    
    // console.log("user details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching user details Error:", error);
    throw error;
  }
};

export const updateProfile = async (data: any) => {
  try {
    const response = await https.put(`user/me`,data);    
    // console.log("user details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching user details Error:", error);
    throw error;
  }
};


export const getCampaigns = async () => {
  try {
    const response = await https.get(`campaigns?page=1&limit=10`);    
    // console.log("campaigns details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching campaigns Error:", error);
    throw error;
  }
};


export const getContacts = async () => {
  try {
    const response = await https.get(`contacts?page=1&limit=10`);    
    // console.log("Contacts details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching contacts Error:", error);
    throw error;
  }
};


export const getNotifications = async () => {
  try {
    const response = await https.get(`notifications?page=1&limit=5`);    
    // console.log("Noifications details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching Noifications details Error:", error);
    throw error;
  }
};


// Organisation/posts/insights?platform=all&startDate=&endDate=
// platform all startDate endDate
export const getPostsInsights = async (platform: string, startDate: string, endDate: string) => {
  try {
    const response = await https.get(`Organisation/posts/insights?platform=${platform || "all"}&startDate=${startDate || ""}&endDate=${endDate || ""}`);    
    // console.log("Posts insights details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching posts insights Error:", error);
    throw error;
  }
};

// Export posts preview
export const getPostsExportPreview = async (format: string, platform: string, startDate: string, endDate: string) => {
  try {
    const response = await https.get(`Organisation/posts/export?format=${format || "xlsx"}&platform=${platform || "all"}&startDate=${startDate || ""}&endDate=${endDate || ""}`);    
    return response.data;
  } 
  catch (error) {
    console.error("Fetching posts export preview Error:", error);
    throw error;
  }
};

// Data preview Export :
export const getDataPreview = async () => {
  try {
    const response = await https.get(`Organisation/posts/export?preview=true`);    
    return response.data;
  } 
  catch (error) {
    console.error("Exporting preview data Error:", error);
    throw error;
  }
};

// Export posts as Excel
export const exportPostsExcel = async (platform: string, startDate: string, endDate: string) => {
  try {
    const response = await https.get(`Organisation/posts/export?format=xlsx&platform=${platform || "all"}&startDate=${startDate || ""}&endDate=${endDate || ""}`, {
      responseType: 'blob',
    });    
    return response.data;
  } 
  catch (error) {
    console.error("Exporting posts as Excel Error:", error);
    throw error;
  }
};

// Export posts as CSV
export const exportPostsCSV = async (platform: string, startDate: string, endDate: string) => {
  try {
    const response = await https.get(`Organisation/posts/export?format=csv&platform=${platform || "all"}&startDate=${startDate || ""}&endDate=${endDate || ""}`, {
      responseType: 'blob',
    });    
    return response.data;
  } 
  catch (error) {
    console.error("Exporting posts as CSV Error:", error);
    throw error;
  }
};





