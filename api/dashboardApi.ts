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







