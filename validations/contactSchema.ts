import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(30, "Name cannot exceed 30 characters")
    .regex(/^[A-Za-z ]+$/, "Name can only contain letters"),

  email: z
    .email("Enter a valid email address"),

  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),

  whatsapp: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit WhatsApp number"),
});

export type ContactSchemaType = z.infer<typeof contactSchema>;
