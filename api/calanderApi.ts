import https from "./https";


export const getScheduledPosts = async () => {
    try {
        const response = await https.get(`scheduled-posts`);
        // console.log("Scheduled Posts: ", response.data);
        return response.data;
    }
    catch (error) {
        console.error("Fetching platform Error:", error);
        throw error;
    }
};
