import { ENV } from "./env.server";

/**
 * Accounts and saved orders need a database. Without DATABASE_URL (and an auth secret) the
 * site runs as a prototype: browsing, the bag and checkout work; sign-in is hidden.
 */
export const accountsEnabled = Boolean(ENV.DATABASE_URL && ENV.BETTER_AUTH_SECRET);
