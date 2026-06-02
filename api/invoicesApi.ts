// invoicesApi.ts
import { InvoicesResponse } from "@/types/types";
import https from "./https";

export const fetchInvoices = async ()=> {
  try {
    // const response = await https.get<InvoicesResponse>(`invoices?userId=${userId}`);
    const response = await https.get(`Invoices`);
    // console.log(response.data);
    return response.data;

  } catch (error) {
    console.log("Fetching Invoices Error:", error);
    return { invoices: [] };
  }
};

 export const getInvoiceById = async (id: string) => {
    try {
      const response = await https.get(`Invoices/${id}`);
      return response.data;
    } catch (error) {
      console.log("Fetching Invoice Error:", error);
      return null;
    }
  };

