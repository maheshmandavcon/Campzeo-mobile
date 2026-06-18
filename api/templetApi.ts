import https from "./https";

export interface TemplateData {
  id?: number;
  name: string;
  description?: string | null;
  content: string;
  subject: string;
  platform: string;
  category: string;
  variables?: Record<string, any>;
  isActive: boolean;
  organisationId?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
  mediaUrls?: string[];
}

export interface TemplateResponse {
  success: boolean;
  data: TemplateData;
  message: string;
}

export const templetApi = {
  createTemplate: async (data: TemplateData): Promise<TemplateResponse> => {
    const response = await https.post("/templates", data);
    return response.data;
  },

  getTemplates: async (): Promise<{ success: boolean; data: TemplateData[] }> => {
    const response = await https.get("/templates");
    return response.data;
  },

  getTemplatesByPlatform: async (platform: string): Promise<{ success: boolean; data: TemplateData[] }> => {
    const response = await https.get(`/templates?platform=${platform}&isActive=true`);
    return response.data;
  },


  getTemplateById: async (id: number): Promise<TemplateResponse> => {
    const response = await https.get(`/templates/${id}`);
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await https.delete(`/templates/${id}`);
    return response.data;
  },

  updateTemplate: async (id: number, data: TemplateData): Promise<TemplateResponse> => {
    const response = await https.put(`/templates/${id}`, data);
    return response.data;
  },
};
