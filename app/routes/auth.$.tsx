import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { modules } from "app/modules/modules.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const ticketModules = await modules.tickets;
  await ticketModules.onInstall(admin.graphql);

  return null;
};
