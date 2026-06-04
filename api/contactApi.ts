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
) => {
  try {
    

    const res = await https.get(`Contacts?organisationId=${orgId}&page=${1}&limit=${1000}&sortBy=createdDate&sortOrder=desc`);
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
  contactIds: number | number[],
  token: string
) => {
  try {
    const payload = {
      contactIds: contactIds,
      organisationId,
    };

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
    console.error(
      "Delete contacts error:",
      error.response || error.message
    );

    throw new Error(
      error?.response?.data?.message ||
      error?.response?.data ||
      "Failed to delete contacts"
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

// IMPORT CONTACTS
export const importContactsApi = async (orgId: number, fileUri: string, fileName: string, fileType: string) => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as any);

    const res = await https.post(`Contacts/Import?organisationId=${orgId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error: any) {
    console.error("Import contacts error:", error.response || error.message);
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to import contacts"
    );
  }
};
