import "server-only";
import { errors } from "./messages/errors";
import { getLocale } from "./server";

export type ActionError = keyof (typeof errors)["en"]["action"];

/** A Server Action error message in the visitor's language. */
export async function te(message: ActionError): Promise<string> {
  return errors[await getLocale()].action[message];
}

/**
 * Translates messages raised by database functions (RAISE EXCEPTION) when we
 * know them; anything else is returned unchanged.
 */
export async function tdb(message: string): Promise<string> {
  const db = errors[await getLocale()].db as Record<string, string>;
  return db[message.trim()] ?? message;
}
