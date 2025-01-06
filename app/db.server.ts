import { CosmosDBSessionStorage } from "@adearriba/shopify-app-session-storage-cosmosdb";
import { CosmosClient } from "@azure/cosmos";

declare global {
  var cosmos: CosmosClient;
}

function throwIfUndefined<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

const endpoint = throwIfUndefined(process.env.COSMOS_ENDPOINT, 'COSMOS_ENDPOINT not configured');
const key = throwIfUndefined(process.env.COSMOS_KEY, 'COSMOS_KEY not configured');
export const dbName = throwIfUndefined(process.env.COSMOS_DBNAME, 'COSMOS_DBNAME not configured');

if (!global.cosmos) {
  global.cosmos = new CosmosClient({
    endpoint,
    key
  });
}

export async function initializeCosmosDatabase() {
  try {
    const { database } = await global.cosmos.databases.createIfNotExists({
      id: dbName
    });
    console.log(`Database ${dbName} initialized successfully`);
    return database;
  } catch (error) {
    console.error(`Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

const cosmosClient: CosmosClient = global.cosmos;

export const cosmosDBSessionStorage = CosmosDBSessionStorage.withClient(cosmosClient, dbName);;