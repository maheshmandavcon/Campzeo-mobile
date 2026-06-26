import { z } from "zod";

// Edit Profile schema ---------------------------------------------------------
export const editProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .regex(
      /^[A-Za-z ]+$/,
      "First name can only contain letters and spaces"
    ),

  lastName: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  mobile: z
    .string()
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
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
      .min(8, "Password must be at least 8 characters"), 

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
