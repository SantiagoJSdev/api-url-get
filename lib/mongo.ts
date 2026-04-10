import { MongoClient } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  __mongoClientPromise?: Promise<MongoClient>;
};

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.trim()) {
    throw new Error("MONGODB_URI is not set");
  }
  return uri.trim();
}

export function getMongoClient(): Promise<MongoClient> {
  if (!globalForMongo.__mongoClientPromise) {
    const client = new MongoClient(getMongoUri(), {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
    globalForMongo.__mongoClientPromise = client.connect();
  }
  return globalForMongo.__mongoClientPromise;
}

export function getDbName(): string {
  return (
    process.env.MONGODB_DATABASE_NAME?.trim() || "quickmarket"
  );
}

export function getRuntimeConfigCollectionName(): string {
  return (
    process.env.RUNTIME_CONFIG_COLLECTION?.trim() || "runtime_config"
  );
}
