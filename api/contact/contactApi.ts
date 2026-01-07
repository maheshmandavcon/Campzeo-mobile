// api/contact/contactApi.ts
import axios from "axios";
import { BASE_URL } from "../config";

export interface ContactData {
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  campaignIds?: number[];
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// CREATE CONTACT
export const createContactApi = async (data: ContactData, token: string) => {
  try {
    const payload = {
      contactName: data.name,
      contactEmail: data.email,
      contactMobile: data.mobile,
      contactWhatsApp: data.whatsapp,
      campaignIds: data.campaignIds,
    };
    const res = await api.post("/contacts", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to create contact"
    );
  }
};

// GET CONTACTS
export const getContactsApi = async (
  token: string,
  page = 1,
  limit = 20,
  search = "",
  campaignId?: number,
  sortBy = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
) => {
  try {
    const res = await api.get("/contacts", {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit, search, sortBy, sortOrder, ...(campaignId && { campaignId }) },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to fetch contacts"
    );
  }
};

// UPDATE CONTACT
export const updateContactApi = async (
  contactId: number,
  data: ContactData,
  token: string
) => {
  try {
    const payload = {
      contactName: data.name,
      contactEmail: data.email,
      contactMobile: data.mobile,
      contactWhatsApp: data.whatsapp,
      campaignIds: data.campaignIds,
    };

    const res = await api.patch(`/contacts/${contactId}`, payload, { // remove /edit
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Update response:", res.data); // Debug log
    return res.data;
  } catch (error: any) {
    console.error("Update contact error:", error.response || error);
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to update contact"
    );
  }
};

// DELETE CONTACTS
export const deleteContactApi = async (
  contactIds: number[],
  token: string
) => {
  try {
    const res = await api.delete("/contacts", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: { contactIds },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.response?.data ||
        "Failed to delete contacts"
    );
  }
};

// EXPORT CONTACTS
export const exportContactsApi = async (token: string) => {
  try {
    const res = await api.get("/contacts/export", {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "arraybuffer", // 👈 important for React Native
    });
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.response?.data ||
        "Failed to export contacts"
    );
  }
};
