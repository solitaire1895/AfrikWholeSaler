import "server-only";
import * as Sentry from "@sentry/nextjs";

// ========================================================
// SMS through Twilio or Africa's Talking, picked from the env variables set:
//   Twilio:           TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
//   Africa's Talking: AT_USERNAME, AT_API_KEY, AT_SENDER_ID (optional)
// SMS_PROVIDER=twilio|africastalking forces one when both are configured.
// Like emails, sending never throws: failures go to Sentry.
// ========================================================

/** "+237 6 99 00 11 22" → "+237699001122"; null if it can't be an international number. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let p = raw.replace(/[^\d+]/g, "");
  if (p.startsWith("00")) p = `+${p.slice(2)}`;
  return /^\+\d{8,15}$/.test(p) ? p : null;
}

function provider(): "twilio" | "africastalking" | null {
  const forced = process.env.SMS_PROVIDER?.toLowerCase();
  const twilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
  const at = Boolean(process.env.AT_USERNAME && process.env.AT_API_KEY);
  if (forced === "twilio" && twilio) return "twilio";
  if (forced === "africastalking" && at) return "africastalking";
  return twilio ? "twilio" : at ? "africastalking" : null;
}

export const smsConfigured = () => provider() !== null;

export async function sendSms(to: string, text: string): Promise<boolean> {
  const phone = normalizePhone(to);
  const which = provider();
  if (!phone || !which) return false;
  const body = text.slice(0, 459); // at most 3 SMS segments
  try {
    let res: Response;
    if (which === "twilio") {
      const sid = process.env.TWILIO_ACCOUNT_SID!;
      res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, From: process.env.TWILIO_FROM!, Body: body }),
        signal: AbortSignal.timeout(15_000),
      });
    } else {
      const sandbox = process.env.AT_USERNAME === "sandbox";
      res = await fetch(`https://api.${sandbox ? "sandbox." : ""}africastalking.com/version1/messaging`, {
        method: "POST",
        headers: { apiKey: process.env.AT_API_KEY!, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: process.env.AT_USERNAME!,
          to: phone,
          message: body,
          ...(process.env.AT_SENDER_ID && { from: process.env.AT_SENDER_ID }),
        }),
        signal: AbortSignal.timeout(15_000),
      });
    }
    if (!res.ok) throw new Error(`${which} ${res.status}: ${await res.text()}`);
    return true;
  } catch (err) {
    Sentry.captureException(err, { tags: { area: "sms" } });
    console.error("SMS not sent:", err);
    return false;
  }
}
