import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  BlockStack,
  Link,
  Text,
  Banner,
  Layout
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { modules } from "app/modules/modules.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const taxincluded = await modules.storeConfig.getTaxesIncluded(session.shop);

  return Response.json({
    shop: session.shop,
    taxesIncluded: taxincluded
  });
}

export default function Index() {
  const { shop, taxesIncluded } = useLoaderData<typeof loader>();

  return (
    <Page
      title="Configuración global"
      fullWidth
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Banner title="Configuración de impuestos" tone="info">
              <p>
                Esta tienda está configurada para <b>{taxesIncluded ? 'incluir' : 'excluir'}</b> los impuestos en los precios de los productos.
                Para cambiar esta configuración, por favor visite la sección de impuestos en la <Link target="_top" url="shopify://admin/settings/taxes" monochrome >configuración de su tienda Shopify.</Link>
              </p>
            </Banner>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}