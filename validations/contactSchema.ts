import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .min(3, "Minimum 3 letters")
    .regex(/^[A-Za-z\s]+$/, "Only letters allowed"),
  email: z
    .string()
    .email("Invalid email"),
  mobile: z
    .string()
    .regex(/^\+?\d{7,15}$/, "Not a valid number"),
  whatsapp: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Not a valid number"),
  campaignIds: z.array(z.number()).optional(),
});

export type ContactSchemaType = z.infer<typeof contactSchema>;
