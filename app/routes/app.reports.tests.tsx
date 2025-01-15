import { useLoaderData } from "@remix-run/react";
import { BlockStack, Card, Layout, Page } from "@shopify/polaris";
import { TimezoneManager } from "app/modules/reports/domain/utils/date-utils";

export async function loader() {
    const year = 2025;
    const month = 1;
    const timezone = 'Europe/Madrid';

    const monthStart = TimezoneManager.getMonthStart(year, month, timezone);
    const lastDayOfMonth = TimezoneManager.getMonthEnd(year, month, timezone);
    const lastDayFormatted = TimezoneManager.formatYYYYMMDD(lastDayOfMonth);

    return {
        dates: {
            monthStart,
            lastDayOfMonth,
            lastDayFormatted,
            timezoneName: timezone
        }
    };
}

export default function TimezoneTest() {
    const loaderData = useLoaderData<typeof loader>();


    return (
        <Page
            title="Monthly Report"
            backAction={{ content: 'Settings', url: '/app' }}
        >
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <div style={{
                                backgroundColor: 'rgb(241, 242, 243)',
                                padding: '1rem',
                                borderRadius: '0.5rem'
                            }}>
                                <pre style={{
                                    whiteSpace: 'pre-wrap',
                                    margin: 0,
                                    fontSize: '0.875rem',
                                    fontFamily: 'monospace'
                                }}>
                                    {JSON.stringify(loaderData, null, 2)}
                                </pre>
                            </div>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page >
    );
}