import { useAuth } from '@clerk/clerk-expo';
import { api } from '../lib/api';

export function useApi() {
    const { userId } = useAuth();

    if (!userId) {
        throw new Error('User must be authenticated to use API');
    }

    return {
        // User
        getMe: () => api.user.getMe(userId),
        updateProfile: (data: Parameters<typeof api.user.updateProfile>[1]) =>
            api.user.updateProfile(userId, data),

        // Campaigns
        getCampaigns: (page?: number, limit?: number, search?: string) =>
            api.campaigns.list(userId, page, limit, search),
        getCampaign: (id: number) => api.campaigns.get(userId, id),
        createCampaign: (data: Parameters<typeof api.campaigns.create>[1]) =>
            api.campaigns.create(userId, data),
        updateCampaign: (id: number, data: Parameters<typeof api.campaigns.update>[2]) =>
            api.campaigns.update(userId, id, data),
        deleteCampaign: (id: number) => api.campaigns.delete(userId, id),

        // Contacts
        getContacts: (page?: number, limit?: number, search?: string) =>
            api.contacts.list(userId, page, limit, search),
        createContact: (data: Parameters<typeof api.contacts.create>[1]) =>
            api.contacts.create(userId, data),

        // Templates
        getTemplates: (platform?: string) => api.templates.list(userId, platform),

        // Media
        uploadMedia: (file: Parameters<typeof api.media.upload>[1]) =>
            api.media.upload(userId, file),
    };
}
