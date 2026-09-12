"use server";

import {
  parentWaitlistSchema,
  clinicianSignupSchema,
  newsletterSchema,
  type FormState,
} from "@/lib/schemas";

/**
 * Forwards submission payload to Google Sheets Web App endpoint
 */
async function forwardToGoogleSheets(payload: {
  type: "parent" | "clinician";
  name: string;
  email: string;
  context: string;
}) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.info(
      `[Google Sheets Sync] Webhook URL not set in GOOGLE_SHEETS_WEBHOOK_URL. Local submission logged:`,
      payload
    );
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(
        `[Google Sheets Sync] Webhook returned HTTP ${response.status}`
      );
    }
  } catch (err) {
    console.error("[Google Sheets Sync] Failed to post submission to Google Sheets:", err);
  }
}

export async function submitParentWaitlist(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    context: formData.get("context"),
  };

  const parsed = parentWaitlistSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Please correct the errors in the form.",
      values: {
        name: typeof rawData.name === "string" ? rawData.name : "",
        email: typeof rawData.email === "string" ? rawData.email : "",
        context: typeof rawData.context === "string" ? rawData.context : "",
      },
    };
  }

  // Record into Google Sheets (Parents tab)
  await forwardToGoogleSheets({
    type: "parent",
    name: parsed.data.name,
    email: parsed.data.email,
    context: parsed.data.context,
  });

  return {
    success: true,
    message: "Thanks — you're on the waitlist! We'll be in touch soon.",
  };
}

export async function submitClinicianSignup(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    context: formData.get("context"),
  };

  const parsed = clinicianSignupSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Please correct the errors in the form.",
      values: {
        name: typeof rawData.name === "string" ? rawData.name : "",
        email: typeof rawData.email === "string" ? rawData.email : "",
        context: typeof rawData.context === "string" ? rawData.context : "",
      },
    };
  }

  // Record into Google Sheets (Clinicians tab)
  await forwardToGoogleSheets({
    type: "clinician",
    name: parsed.data.name,
    email: parsed.data.email,
    context: parsed.data.context,
  });

  return {
    success: true,
    message: "Thanks — our clinical lead will be in touch with you shortly.",
  };
}

export async function subscribeNewsletter(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = {
    email: formData.get("email"),
  };

  const parsed = newsletterSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Please enter a valid email address.",
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    success: true,
    message: "You're on the list — thank you for subscribing!",
  };
}
