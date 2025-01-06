import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate, registerWebhooks } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const response = await registerWebhooks({ session });
  return Response.json(response);
};
