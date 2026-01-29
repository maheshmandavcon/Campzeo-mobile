import https from "../https";

export interface ContactData {
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  campaignIds?: number[];
}

// ---------------------- Contacts API ---------------------- //

// CREATE CONTACT
export const createContactApi = async (data: ContactData) => {
  try {
    const payload = {
      contactName: data.name,
      contactEmail: data.email,
      contactMobile: data.mobile,
      contactWhatsApp: data.whatsapp,
      campaignIds: data.campaignIds,
    };

    const res = await https.post("/contacts", payload);
    return res.data;
  } catch (error: any) {
    console.error("Create contact error:", error.response || error.message);
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to create contact"
    );
  }
};

// GET CONTACTS
export const getContactsApi = async (
  page = 1,
  limit = 20,
  search = "",
  campaignId?: number,
  sortBy = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
) => {
  try {
    const params: any = { page, limit, search, sortBy, sortOrder };
    if (campaignId) params.campaignId = campaignId;

    const res = await https.get("/contacts", { params });
    return res.data;
  } catch (error: any) {
    console.error("Get contacts error:", error.response || error.message);
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to fetch contacts"
    );
  }
};

// UPDATE CONTACT
export const updateContactApi = async (contactId: number, data: ContactData) => {
  try {
    const payload = {
      contactName: data.name,
      contactEmail: data.email,
      contactMobile: data.mobile,
      contactWhatsApp: data.whatsapp,
      campaignIds: data.campaignIds,
    };

    const res = await https.patch(`/contacts/${contactId}`, payload);
    console.log("Update response:", res.data); // Optional debug log
    return res.data;
  } catch (error: any) {
    console.error("Update contact error:", error.response || error.message);
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to update contact"
    );
  }
};

// DELETE CONTACTS
export const deleteContactApi = async (contactIds: number[]) => {
  try {
    const res = await https.delete("/contacts", {
      headers: { "Content-Type": "application/json" },
      data: { contactIds },
    });

    return res.data;
  } catch (error: any) {
    console.error("Delete contacts error:", error.response || error.message);
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to delete contacts"
    );
  }
};

// EXPORT CONTACTS
export const exportContactsApi = async () => {
  try {
    const res = await https.get("/contacts/export", {
      responseType: "arraybuffer", // Important for file downloads
    });

    return res.data;
  } catch (error: any) {
    console.error("Export contacts error:", error.response || error.message);
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to export contacts"
    );
  }
};
