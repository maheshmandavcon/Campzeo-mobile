import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ||
    'https://campzeo-v1-oym2-89z2z69ei-rahulsteves-projects.vercel.app';
const MOBILE_API_KEY = Constants.expoConfig?.extra?.mobileApiKey || '';

interface ApiOptions extends RequestInit {
    userId?: string;
}

interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    status: number;
}

/**
 * Base API request function
 */
async function apiRequest<T = any>(
    endpoint: string,
    options: ApiOptions = {}
): Promise<ApiResponse<T>> {
    const { userId, ...fetchOptions } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-api-key': MOBILE_API_KEY,
        ...(userId && { 'x-clerk-user-id': userId }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.error || data.message || 'Request failed',
                status: response.status,
            };
        }

        return {
            data,
            status: response.status,
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Network error',
            status: 0,
        };
    }
}

/**
 * API client with all endpoints
 */
export const api = {
    // ============ USER ============
    user: {
        getMe: (userId: string) =>
            apiRequest('/api/user/me', { userId }),

        updateProfile: (userId: string, data: { firstName?: string; lastName?: string; mobile?: string }) =>
            apiRequest('/api/user/me', {
                method: 'PUT',
                body: JSON.stringify(data),
                userId,
            }),

        getSocialStatus: (userId: string) =>
            apiRequest('/api/user/social-status', { userId }),

        sync: (userId: string) =>
            apiRequest('/api/user/sync', {
                method: 'POST',
                userId,
            }),
    },

    // ============ CAMPAIGNS ============
    campaigns: {
        list: (userId: string, page = 1, limit = 10, search = '') =>
            apiRequest(`/api/campaigns?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { userId }),

        get: (userId: string, id: number) =>
            apiRequest(`/api/campaigns/${id}`, { userId }),

        create: (userId: string, data: {
            name: string;
            description?: string;
            startDate: string;
            endDate: string;
            contactIds?: number[];
        }) =>
            apiRequest('/api/campaigns', {
                method: 'POST',
                body: JSON.stringify(data),
                userId,
            }),

        update: (userId: string, id: number, data: {
            name: string;
            description?: string;
            startDate: string;
            endDate: string;
            contactIds?: number[];
        }) =>
            apiRequest(`/api/campaigns/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
                userId,
            }),

        delete: (userId: string, id: number) =>
            apiRequest(`/api/campaigns/${id}`, {
                method: 'DELETE',
                userId,
            }),
    },

    // ============ CAMPAIGN POSTS ============
    posts: {
        list: (userId: string, campaignId: number) =>
            apiRequest(`/api/campaigns/${campaignId}/posts`, { userId }),

        create: (userId: string, campaignId: number, data: {
            subject?: string;
            message: string;
            type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'LINKEDIN' | 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE' | 'PINTEREST';
            mediaUrls?: string[];
            scheduledPostTime?: string;
        }) =>
            apiRequest(`/api/campaigns/${campaignId}/posts`, {
                method: 'POST',
                body: JSON.stringify(data),
                userId,
            }),
    },

    // ============ CONTACTS ============
    contacts: {
        list: (userId: string, page = 1, limit = 10, search = '') =>
            apiRequest(`/api/contacts?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { userId }),

        get: (userId: string, id: number) =>
            apiRequest(`/api/contacts/${id}`, { userId }),

        create: (userId: string, data: {
            contactName: string;
            contactEmail?: string;
            contactMobile?: string;
            contactWhatsApp?: string;
            campaignIds?: number[];
        }) =>
            apiRequest('/api/contacts', {
                method: 'POST',
                body: JSON.stringify(data),
                userId,
            }),

        update: (userId: string, id: number, data: {
            contactName?: string;
            contactEmail?: string;
            contactMobile?: string;
            contactWhatsApp?: string;
        }) =>
            apiRequest(`/api/contacts/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
                userId,
            }),

        bulkDelete: (userId: string, contactIds: number[]) =>
            apiRequest('/api/contacts', {
                method: 'DELETE',
                body: JSON.stringify({ contactIds }),
                userId,
            }),
    },

    // ============ TEMPLATES ============
    templates: {
        list: (userId: string, platform?: string) =>
            apiRequest(`/api/templates${platform ? `?platform=${platform}` : ''}`, { userId }),

        get: (userId: string, id: number) =>
            apiRequest(`/api/templates/${id}`, { userId }),

        create: (userId: string, data: {
            name: string;
            content: string;
            platform: string;
            subject?: string;
            category?: string;
        }) =>
            apiRequest('/api/templates', {
                method: 'POST',
                body: JSON.stringify(data),
                userId,
            }),
    },

    // ============ PAYMENTS ============
    payments: {
        list: (userId: string) =>
            apiRequest('/api/payments', { userId }),

        createOrder: (userId: string, plan: string, isSignup = false) =>
            apiRequest('/api/razorpay/create-order', {
                method: 'POST',
                body: JSON.stringify({ plan, isSignup }),
                userId,
            }),
    },

    // ============ MEDIA UPLOAD ============
    media: {
        upload: async (userId: string, file: { uri: string; name: string; type: string }) => {
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.type,
            } as any);

            const response = await fetch(`${API_BASE_URL}/api/socialmedia/upload-media-file`, {
                method: 'POST',
                headers: {
                    'x-api-key': MOBILE_API_KEY,
                    'x-clerk-user-id': userId,
                },
                body: formData,
            });

            return response.json();
        },
    },
};
