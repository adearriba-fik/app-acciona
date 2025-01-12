import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { Bleed, BlockStack, Box, Card, Checkbox, Layout, Link, Page, Text } from "@shopify/polaris";
import { modules } from "app/modules/modules.server";
import { authenticate } from "app/shopify.server";
import { useCallback, useEffect, useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const storeConfigModule = await modules.storeConfig;
  const config = await storeConfigModule.getStoreConfig(session.shop);

  return Response.json({
    shop: session.shop,
    taxesIncluded: config?.taxesIncluded ?? true
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const taxesIncluded = formData.get('taxesIncluded') === 'true';

  const storeConfigModule = await modules.storeConfig;
  await storeConfigModule.saveStoreConfig({
    id: session.shop,
    shop: session.shop,
    taxesIncluded,
    created_at: new Date(),
    updated_at: new Date()
  });

  return Response.json({
    status: 'success',
  });
}

export default function Index() {
  const { taxesIncluded: initialTaxesIncluded } = useLoaderData<typeof loader>();
  const [taxesIncluded, setTaxesIncluded] = useState(initialTaxesIncluded);
  const [isDirty, setIsDirty] = useState(false);
  const submit = useSubmit();
  const app = useAppBridge();

  const handleSave = useCallback(async () => {
    const formData = new FormData();
    formData.append('taxesIncluded', taxesIncluded.toString());
    await submit(formData, { method: 'post' });
    setIsDirty(false);
    app.saveBar.hide('store-config-save-bar');
  }, [app, taxesIncluded, submit]);

  const handleDiscard = useCallback(() => {
    setTaxesIncluded(initialTaxesIncluded);
    setIsDirty(false);
  }, [initialTaxesIncluded]);

  const handleChange = useCallback((checked: boolean) => {
    setTaxesIncluded(checked);
    setIsDirty(checked != initialTaxesIncluded);
  }, [initialTaxesIncluded]);

  useEffect(() => {
    if (isDirty) {
      app.saveBar.show('store-config-save-bar');
    } else {
      app.saveBar.hide('store-config-save-bar');
    }
  }, [isDirty]);

  return (
    <Page
      title="Configuración global"
    >
      <SaveBar
        id="store-config-save-bar"
        discardConfirmation>
        <button variant="primary" onClick={handleSave}></button>
        <button onClick={handleDiscard}></button>
      </SaveBar>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Impuestos y tasas</Text>
                <BlockStack gap="400">
                  <Checkbox
                    label="Incluir impuestos en el precio del producto"
                    checked={taxesIncluded}
                    onChange={handleChange}
                    helpText={
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Esta configuración determina cómo el sistema maneja los cálculos de impuestos al generar números de ticket para pedidos y devoluciones.
                        </Text>
                      </BlockStack>
                    }
                  />
                </BlockStack>
              </BlockStack>
              <Bleed marginBlockEnd="400" marginInline="400">
                <Box background="bg-surface-secondary" padding="400">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm" fontWeight="medium">
                      Esta configuración debe ser exactamente igual a la configurada en la tienda.
                    </Text>
                  </BlockStack>
                </Box>
              </Bleed>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}