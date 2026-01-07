import { z } from "zod";

// Create Campaign schema
export const createCampaignSchema = z
  .object({
    campaignName: z
      .string()
      .min(3, "Campaign name must be at least 3 characters"),

    startDate: z.date()
    .nullable()
    .refine((v) => !!v, { message: "Start date is required" }),


    endDate: z.date()
    .nullable()
    .refine((v) => !!v, { message: "End date is required" }),

    descriptionMessage: z
      .string()
      .min(5, "Description must be at least 5 characters"),
  })
  .refine(
  (data) =>
    !data.startDate || // allow null so required_error can handle it
    data.startDate >= new Date(new Date().setHours(0, 0, 0, 0)),
  {
    message: "Start date cannot be in the past",
    path: ["startDate"],
  }
)
.refine(
  (data) =>
    !data.startDate || 
    !data.endDate || 
    data.endDate >= data.startDate,
  {
    message: "End date cannot be earlier than start date",
    path: ["endDate"],
  }
);

export type CreateCampaignSchemaType = z.infer<typeof createCampaignSchema>;


// Create Post Schema
export const createPostSchema = (campaignStart: Date, campaignEnd: Date, campaignCreatedAt: Date) =>
  z
    .object({
      subject: z
        .string()
        .min(3, "Subject must be at least 3 characters"),

      message: z
        .string()
        .min(5, "Message must be at least 5 characters"),

      postDateTime: z.date()
      .refine((v) => !!v, { message: "Post date and time is required" }),

      file: z
        .any()
        .refine((file) => !!file, "Please upload a file")
        .refine(
          (file) =>
            ["image/", "video/"].some((type) => file?.mimeType?.startsWith(type)),
          "File must be an image or video"
        ),
    })

    // 1. Post datetime must be between campaign start & end
    .refine(
      (data) =>
        data.postDateTime >= campaignStart &&
        data.postDateTime <= campaignEnd,
      {
        message:
          "Post date/time must be within the campaign start and end dates",
        path: ["postDateTime"],
      }
    )

    // 2. Post datetime cannot be before the time campaign was created
    .refine(
      (data) => data.postDateTime >= campaignCreatedAt,
      {
        message: "Post time cannot be earlier than campaign creation time",
        path: ["postDateTime"],
      }
    );

export type CreatePostSchemaType = z.infer<
  ReturnType<typeof createPostSchema>
>;

