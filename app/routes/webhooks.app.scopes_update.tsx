import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { cosmosDBSessionStorage } from "app/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { payload, session, topic, shop } = await authenticate.webhook(request);
    console.log(`Received ${topic} webhook for ${shop}`);

    const current = payload.current as string[];
    if (session) {
        const cosmosSession = await cosmosDBSessionStorage.loadSession(session.id);
        if (!cosmosSession) return new Response();

        cosmosSession.scope = current.toString();
        await cosmosDBSessionStorage.storeSession(cosmosSession);
    }
    return new Response();
};
