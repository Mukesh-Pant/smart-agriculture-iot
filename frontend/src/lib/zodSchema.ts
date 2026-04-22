import z from "zod";

export const onboardingSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "First name must be at least 3 characters" })
    .max(50, { message: "First name max 50 characters" }),

  lastName: z
    .string()
    .min(3, { message: "Last name must be at least 3 characters" })
    .max(50, { message: "Last name max 50 characters" }),

  role: z.string().optional(),

  device_id: z
    .string()
    .min(3, { message: "Add your ESP-32 microcontroller ID" })
    .max(20, { message: "Device ID max 20 characters" }),

  district: z.string().max(50).optional(),

  region: z.enum(["Terai", "Mid-hills", "Hilly", "Mountain"]).optional(),

  phone: z
    .string()
    .regex(/^[0-9+\-\s]{7,15}$/, { message: "Enter a valid phone number" })
    .optional()
    .or(z.literal("")),
});
