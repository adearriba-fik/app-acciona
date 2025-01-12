import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { modules } from "app/modules/modules.server";
import { RefundCreatePayload } from "app/modules/tickets/domain/entities/RefundCreatedPayload";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, admin, payload } = await authenticate.webhook(request);

  if (!admin) {
    return new Response(null, { status: 401 });
  }

  console.log(`Received ${topic} webhook for ${shop}`);

  const ticketsModule = await modules.tickets;

  await ticketsModule.getRefundCreateWebhookHandler().handle({
    payload: payload as RefundCreatePayload,
    shop: shop,
    graphqlClient: admin.graphql,
    topic: topic,
  });

  return new Response();
};
