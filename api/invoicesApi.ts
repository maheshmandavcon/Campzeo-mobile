// invoicesApi.ts
import { InvoicesResponse } from "@/types/types";
import https from "./https";

export const fetchInvoices = async (
  userId: string
): Promise<InvoicesResponse> => {
  try {
    const response = await https.get<InvoicesResponse>(`invoices?userId=${userId}`);
    // console.log(response.data);
    return response.data;

  } catch (error) {
    console.log("Fetching Invoices Error:", error);
    return { invoices: [] };
  }
};

