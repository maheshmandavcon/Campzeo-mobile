import https from "./https";


export const getScheduledPosts = async (orgId: string) => {
    try {
        const response = await https.get(`Campaigns/scheduled-posts?organisationId=${orgId}`);
        // console.log("Scheduled Posts: ", response.data);
        return response.data;
    }
    catch (error) {
        console.error("Fetching platform Error:", error);
        throw error;
    }
};
