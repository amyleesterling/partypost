import { z } from "zod";
import type { ThemeKey } from "./themes";

const themeKeys = [
  "default", "beach", "princess", "woodland", "space",
  "rainbow", "science", "garden-tea", "arcade", "dinosaur",
] as const satisfies readonly ThemeKey[];

const optionalNumber = z
  .union([z.coerce.number().int().min(0).max(1000), z.literal("")])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v == null ? null : v));

const optionalText = z.string().trim().max(2000).optional().nullable().transform((v) => (v ? v : null));
const optionalShortText = z.string().trim().max(500).optional().nullable().transform((v) => (v ? v : null));
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => !v || /^https?:\/\//i.test(v), "Must be a URL");
const optionalEmail = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email");

export const partyCreateSchema = z.object({
  birthday_child_name: z.string().trim().min(1, "Required").max(120),
  birthday_age: optionalNumber,
  party_title: z.string().trim().min(1, "Required").max(200),
  description: optionalText,
  date: z.string().trim().optional().nullable().transform((v) => v || null),
  start_time: z.string().trim().optional().nullable().transform((v) => v || null),
  end_time: z.string().trim().optional().nullable().transform((v) => v || null),
  timezone: z.string().trim().optional().nullable().transform((v) => v || null),
  location_name: optionalShortText,
  location_address: optionalShortText,
  map_url: optionalUrl,
  rsvp_deadline: z.string().trim().optional().nullable().transform((v) => v || null),
  host_name: z.string().trim().max(120).optional().nullable().transform((v) => (v ? v : null)),
  host_email: optionalEmail,
  host_phone: z.string().trim().max(40).optional().nullable().transform((v) => (v ? v : null)),
  gift_note: optionalShortText,
  food_note: optionalShortText,
  rain_plan: optionalShortText,
  theme: z.enum(themeKeys).optional(),
});

export type PartyCreateInput = z.input<typeof partyCreateSchema>;
export type PartyCreateOutput = z.output<typeof partyCreateSchema>;

export const partyUpdateSchema = partyCreateSchema.partial().extend({
  is_published: z.boolean().optional(),
  hero_image_url: z.string().url().optional().nullable(),
  profile_image_url: z.string().url().optional().nullable(),
});

export type PartyUpdateInput = z.input<typeof partyUpdateSchema>;
export type PartyUpdateOutput = z.output<typeof partyUpdateSchema>;

export const rsvpSchema = z
  .object({
    status: z.enum(["yes", "no"]),
    parent_names: z.string().trim().min(1, "Please tell us your name").max(200),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().trim().max(40).optional().nullable().transform((v) => (v ? v : null)),
    child_names: z.string().trim().max(200).optional().nullable().transform((v) => (v ? v : null)),
    kids_count: z.coerce.number().int().min(0).max(50),
    adults_count: z.coerce.number().int().min(0).max(50),
    allergy_notes: z.string().trim().max(500).optional().nullable().transform((v) => (v ? v : null)),
    private_note: z.string().trim().max(1000, "Max 1000 characters").optional().nullable().transform((v) => (v ? v : null)),
    public_note: z.string().trim().max(500, "Max 500 characters").optional().nullable().transform((v) => (v ? v : null)),
  })
  .superRefine((data, ctx) => {
    if (data.status === "yes" && data.kids_count + data.adults_count === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "If you're coming, please add at least one attendee",
        path: ["kids_count"],
      });
    }
  });

export type RsvpInput = z.input<typeof rsvpSchema>;
export type RsvpOutput = z.output<typeof rsvpSchema>;
