export interface Post {
    id: number;
    platform:
    | "sms"
    | "whatsapp"
    | "pinterest"
    | "youtube"
    | "email"
    | "instagram"
    | "linkedin"
    | "facebook";
    campaign: string;
    message: string;
    scheduledTime: string; 
}


export interface CalendarEvent {
  id: number;
  title: string;              
  start: Date;                 
  end: Date;                   
  platform: string;           
  message: string;             
  campaign: string;            
}


// interface CalendarHeaderProps {
//   currentDate: Date;  
//   viewMode: "month" | "week" | "day";
//   onChangeView: (mode: "month" | "week" | "day") => void;
//   onChangeDate: (date: Date) => void;
// }

// types/invoice.ts
export interface Invoice {
  id: number;
  subscriptionId: number;
  invoiceDate: string;
  dueDate: string;
  paidDate: string;
  status: "PAID" | "PENDING" | "FAILED";
  amount: string;
  taxAmount: string;
  discountAmount: string;
  balance: string;
  currency: string;
  description: string;
  invoiceNumber: string;
  paymentMethod: "RAZORPAY" | "STRIPE" | "CASH";
  taxInformation: any | null;
  pdfBytes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;

  subscription: {
    id: number;
    organisationId: number;
    planId: number;

    plan: {
      id: number;
      name: string;
      price: string;
    };

    organisation: {
      id: number;
      name: string;
    };
  };
}


export interface InvoicesResponse {
  invoices: Invoice[];
}
