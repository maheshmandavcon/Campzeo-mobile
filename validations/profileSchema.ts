import { z } from "zod";

// Edit Profile schema ---------------------------------------------------------
export const editProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .regex(/^[A-Za-z ]+$/, "First name can only contain letters and spaces")
    .optional()
    .or(z.literal("")), // allow empty if user doesn’t want to update it

  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .regex(/^[A-Za-z ]+$/, "Last name can only contain letters and spaces")
    .optional()
    .or(z.literal("")),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

export type EditProfileSchemaType = z.infer<typeof editProfileSchema>;




// Change password schema -----------------------------------------------------
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"), // optional UX rule

    reEnterNewPassword: z.string(),
  })
  .refine(
    (data) => data.newPassword === data.reEnterNewPassword,
    {
      message: "Passwords do not match",
      path: ["reEnterNewPassword"],
    }
  );

export type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>;
