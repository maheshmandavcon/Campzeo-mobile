import https from "./https";

export const getUsage = async () => {
  try {
    const response = await https.get(`subscription/usage`);    
    // console.log("usage details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching usage details Error:", error);
    throw error;
  }
};

export const getCurrentSubscription = async () => {
  try {
    const response = await https.get(`subscription/current`);    
    // console.log("Current Subscription details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching Current Subscription details Error:", error);
    throw error;
  }
};


export const updateAutoRenew = async (autoRenew: boolean) => {
  try {
    const response = await https.post(`subscription/auto-renew`, {
    autoRenew: autoRenew,
  });    
    // console.log("Auto renew details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching Current Subscription details Error:", error);
    throw error;
  }
};


export const cancelSubscription = async (subscription: boolean, message: string) => {
  try {
    const response = await https.post(`subscription/cancel`, {
    immediate: subscription,
    reason: message
  });    
    // console.log("Auto renew details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching Current Subscription details Error:", error);
    throw error;
  }
};


export const getPlans = async () => {
  try {
    const response = await https.get(`plans`);    
    // console.log("Plans details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching Plans details Error:", error);
    throw error;
  }
};


export const getPayments = async () => {
  try {
    const response = await https.get(`payments`);    
    // console.log("Payments details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching Payments Error:", error);
    throw error;
  }
};


