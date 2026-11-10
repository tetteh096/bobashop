import mongoose from "mongoose";

import type { DatabaseConfig } from "./config";

type MongoClient = InstanceType<typeof mongoose.mongo.MongoClient>;

// Reused across hot reloads in dev and across invocations of a warm serverless function.
const globalForMongo = globalThis as typeof globalThis & { __bobashopMongo?: MongoClient };

/**
 * Returns a database handle without opening a connection: the driver connects on
 * the first query. That keeps `next build` (which loads server modules to collect
 * page config) from needing a reachable database.
 */
export async function createDb(env: DatabaseConfig) {
  globalForMongo.__bobashopMongo ??= new mongoose.mongo.MongoClient(env.DATABASE_URL);
  return globalForMongo.__bobashopMongo.db();
}

export type Database = Awaited<ReturnType<typeof createDb>>;
