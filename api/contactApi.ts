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


    const res = await https.get(`Contacts?organisationId=${orgId}&page=${1}&limit=${10}&sortBy=createdDate&sortOrder=desc`);
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
      contactIds: contactIds,
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
    console.log("Status:", error.response?.status);
  console.log("Data:", error.response?.data);
  console.log("Headers:", error.response?.headers);
  console.log("Request:", error.config?.data);
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
