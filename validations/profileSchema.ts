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

  
  mobile: z
    .string()
    // .min(10, "Mobile number must be at least 10 digits")
    // .max(10, "Mobile number cannot exceed 10 digits")
    // .regex(/^[0-9]+$/, "Mobile number can only contain numbers")
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
