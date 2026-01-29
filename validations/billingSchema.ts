import { z } from "zod";

export const cancelSchema = z.object({
    cancelImmediately: z
        .boolean()
        .nullable()
        .refine((val) => val !== null, {
            message: "*Please select when cancellation should take effect",
        }),

    reason: z.string().optional(),
});

export type CancelFormValues = z.infer<typeof cancelSchema>;
