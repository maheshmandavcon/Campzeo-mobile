import https from "./https";

export const getUsage = async () => {
  try {
    const response = await https.get(`Subscriptions/usage`);    
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
    const response = await https.get(`Subscriptions/current`);    
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
    const response = await https.get(`Admin/BillingPlans/GetAllPlans?isActive=true&sortBy=price&sortOrder=asc`);
    return response.data;
  } 
  catch (error) {
    console.error("Fetching Plans details Error:", error);
    throw error;
  }
};


export const getPayments = async () => {
  try {
    const response = await https.get(`Invoices`);    
    // console.log("Payments details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching Payments Error:", error);
    throw error;
  }
};


// twilio request post message : twilio/request-access
// payload : reason: "testing to get header - amit"

export const requestTwilioAccess = async (reason: string) => {
  try {
    const response = await https.post(`twilio/request-access`, {
    reason: reason
  });    
    // console.log("Auto renew details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching Current Subscription details Error:", error);
    throw error;
  }
};


// wallet/balance

  {/* {
    "isSuccess": true,
    "wallet": {
        "smsCreditsAvailable": 0,
        "smsCreditsUsed": 0,
        "whatsappCreditsAvailable": 0,
        "whatsappCreditsUsed": 0,
"transactions": [
            {
                "id": 147,
                "walletId": 63,
                "amount": 3000,
                "type": "CREDIT",
                "service": "WHATSAPP",
                "description": "Purchased Pro WhatsApp Pack (3000 credits)",
                "campaignId": null,
                "createdAt": "2026-04-17T06:56:23.475Z"
            }
        ]
    },
    "twilioAccess": {
        "twilioAccessStatus": "PENDING", APPROVED , NONE , REJECTED
        "twilioAccessReason": "testing to get header - amit"
    }
} */}

export const getWalletBalance = async () => {
  try {
    const response = await https.get(`wallet/balance`);    
    // console.log("Wallet balance details: ",response.data);   
    return response.data;
  } 
  catch (error) {
    console.error("Fetching wallet balance Error:", error);
    throw error;
  }
};

export const getCreditPackages = async () => {
  try {
    const response = await https.get(`Payments/credit-packages`);
    return response.data;
  } catch (error) {
    console.error("Fetching credit packages Error:", error);
    throw error;
  }
};

export const getAddOns = async () => {
  try {
    const response = await https.get(`AddOns`);
    return response.data;
  } catch (error) {
    console.error("Fetching add-ons Error:", error);
    throw error;
  }
};