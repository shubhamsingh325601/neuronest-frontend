import { z } from "zod";

export const parentWaitlistSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Please enter a valid email address"),
  context: z.string().min(1, "Please select an option"),
});

export type ParentWaitlistInput = z.infer<typeof parentWaitlistSchema>;

export const clinicianSignupSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Please enter a valid email address"),
  context: z.string().min(1, "Please select an area of practice"),
});

export type ClinicianSignupInput = z.infer<typeof clinicianSignupSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

export type FormState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  values?: Record<string, string>;
};
