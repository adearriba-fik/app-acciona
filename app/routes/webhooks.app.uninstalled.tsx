import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { cosmosDBSessionStorage } from "app/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  if (session) {
    const sessions = await cosmosDBSessionStorage.findSessionsByShop(shop);
    await cosmosDBSessionStorage.deleteSessions(sessions.map(s => s.id));
  }

  return new Response();
};
