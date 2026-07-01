import https from "./https";

export interface ContactData {
  id?: number;
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  campaignIds?: number[];
}

// ---------------------- Contacts API ---------------------- //

// CREATE CONTACT
export const createContactApi = async (orgId: number, data: ContactData) => {
  try {
    const payload = {
      contactName: data.name,
      contactEmail: data.email,
      contactMobile: data.mobile,
      contactWhatsApp: data.whatsapp,
      campaignIds: data.campaignIds,
      organisationId: orgId,
    };

    const res = await https.post("Contacts/AddContact", payload);
    return res.data;
  } catch (error: any) {
    const apiData = error?.response?.data;

    if (error?.response?.status === 409 && apiData?.duplicate) {
      throw new Error(apiData.error);
    }

    throw new Error(
      apiData?.error ||
      apiData?.message ||
      error?.message ||
      "Failed to create contact"
    );
  }
};

// GET CONTACTS
export const getContactsApi = async (
  orgId: number,
  page: number = 1,
  limit: number = 10,
  search: string = "",
  sortBy: string = "createdDate",
  sortOrder: string = "desc"
) => {
  try {
    let url = `Contacts?organisationId=${orgId}&page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    const res = await https.get(url);
    return res.data;
  } catch (error: any) {
    console.error("Get contacts error:", error.response || error.message);
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to fetch contacts"
    );
  }
};

// UPDATE CONTACT
// export const updateContactApi = async (contactId: number, data: ContactData) => {
//   try {
//     const payload = {
//       contactName: data.name,
//       contactEmail: data.email,
//       contactMobile: data.mobile,
//       contactWhatsApp: data.whatsapp,
//       campaignIds: data.campaignIds,
//     };

//     const res = await https.patch(`/contacts/${contactId}`, payload);
//     console.log("Update response:", res.data); // Optional debug log
//     return res.data;
//   } catch (error: any) {
//     console.error("Update contact error:", error.response || error.message);
//     throw new Error(
//       error?.response?.data?.message || error?.response?.data || "Failed to update contact"
//     );
//   }
// };
export const updateContactApi = async (orgId: number, data: ContactData) => {
  try {
    const payload = {
      contactName: data.name,
      contactEmail: data.email,
      contactMobile: data.mobile,
      contactWhatsApp: data.whatsapp,
      campaignIds: data.campaignIds,
      id: data.id,
      organisationId: orgId,
    };

    const res = await https.post(`Contacts/UpdateContact`, payload);
    console.log("Update response:", res.data);
    return res.data;
  } catch (error: any) {
    const apiData = error?.response?.data;

    // Check for duplicate email
    if (error?.response?.status === 409 && apiData?.duplicate) {
      throw new Error(apiData.error || "Email already exists");
    }

    // Fallback generic error
    throw new Error(
      apiData?.error || apiData?.message || error?.message || "Failed to update contact"
    );
  }
};

// DELETE CONTACTS
export const deleteContactApi = async (
  organisationId: number,
  contactIds: number ,
  token: string
) => {
  try {
    const payload = {
      id: contactIds,
      organisationId,
    };
    console.log("payload", payload);
    const res = await https.post(
      "Contacts/DeleteContact",
      payload
      , {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Delete contact error details:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    
    const apiData = error?.response?.data;
    throw new Error(
      apiData?.error || 
      apiData?.message || 
      error?.message || 
      "Failed to delete contact"
    );
  }
};

// BULK DELETE CONTACTS
export const bulkDeleteContactsApi = async (
  organisationId: number,
  contactIds: number[]
) => {
  try {
    const payload = {
      contactIds,
      organisationId,
    };

    console.log("Bulk Delete Payload:", payload);

    const res = await https.post(
      "Contacts/BulkDelete",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (error: any) {
    console.error("Bulk delete error:", error.response || error.message);

    throw new Error(
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Failed to delete contacts"
    );
  }
};

// IMPORT CONTACTS (CSV bulk upload)
export const importContactsApi = async (orgId: number, fileUri: string, fileName: string) => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: "text/csv",
    } as any);

    const res = await https.post(
      `Contacts/Import?organisationId=${orgId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Import contacts error:", error.response || error.message);
    throw new Error(
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data ||
      "Failed to import contacts"
    );
  }
};

// EXPORT CONTACTS
export const exportContactsApi = async (orgId: number) => {
  try {
    console.log("orgId",orgId);
    const res = await https.get(`Contacts/Export?organisationId=${orgId}`, {
      responseType: "blob", // Important for file downloads
    });
    return res.data;
  } catch (error: any) {
    console.error("Export contacts error:", error.response || error.message);
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to export contacts"
    );
  }
};
