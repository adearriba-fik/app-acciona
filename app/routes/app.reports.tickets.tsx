import React, { useState } from 'react';
import { Form, useActionData, useNavigation, useSubmit } from '@remix-run/react';
import { Banner, BlockStack, Button, Card, Layout, Page, Select, SelectOption, Text } from '@shopify/polaris';
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from 'app/shopify.server';
import { modules } from 'app/modules/modules.server';
import { MonthlyReport } from 'app/modules/reports/domain/entities/MonthlyReport';

interface ActionData {
    success: boolean;
    report?: MonthlyReport;
    response?: any;
    error?: string;
}

export async function action({ request }: ActionFunctionArgs): Promise<ActionData> {
    await authenticate.admin(request);

    try {
        const formData = await request.formData();
        const intent = formData.get("intent");
        const reportingModule = await modules.reports;

        const year = Number(formData.get("year"));
        const month = Number(formData.get("month"));

        if (intent == 'generate') {
            if (!year || !month || month < 1 || month > 12) {
                return {
                    success: false,
                    error: "Invalid year or month"
                };
            }

            const report = await reportingModule.generateMonthlyReport(year, month);


            return {
                success: true,
                report,
            };
        } else if (intent == 'send') {
            if (!year || !month || month < 1 || month > 12) {
                return {
                    success: false,
                    error: "Invalid year or month"
                };
            }

            const response = await reportingModule.sendReport(year, month);
            return {
                success: true,
                response,
            };
        } else if (intent == 'retry') {
            const response = await reportingModule.retryFailedReports();

            return {
                success: true,
                response
            };
        }

        return {
            success: false,
            error: 'Unknown intent'
        };
    } catch (error: any) {
        console.error('Error:', error);
        return {
            success: false,
            error: error.message || "Operation failed",
        };
    }
};

export default function ReportForm() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const isSubmitting = navigation.state === "submitting";

    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString());

    const years = Array.from(
        { length: 5 },
        (_, i) => today.getFullYear() - 2 + i
    );

    const months = [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" }
    ];

    function sendForm() {
        const formData = new FormData(document.getElementsByName('ReportForm')[0] as HTMLFormElement);
        formData.append("intent", "generate");
        submit(formData, { method: "post" });
    }

    function sendReport() {
        const formData = new FormData(document.getElementsByName('ReportForm')[0] as HTMLFormElement);
        formData.append("intent", "send");
        submit(formData, { method: "post" });
    }

    function resendFailures() {
        const formData = new FormData();
        formData.append("intent", "retry");
        submit(formData, { method: "post" });
    }

    return (
        <Page
            title="Monthly Report"
            backAction={{ content: 'Settings', url: '/app' }}
        >
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Form method="post" name='ReportForm'>
                                <BlockStack gap="400">
                                    <Select
                                        label="Year"
                                        options={years.map<SelectOption>(year => ({
                                            label: year.toString(),
                                            value: year.toString(),
                                        }))}
                                        value={selectedYear.toString()}
                                        onChange={setSelectedYear}
                                        name="year"
                                    />
                                    <Select
                                        label="Month"
                                        options={months.map<SelectOption>(month => ({
                                            label: month.label,
                                            value: month.value.toString(),
                                        }))}
                                        value={selectedMonth.toString()}
                                        onChange={setSelectedMonth}
                                        name="month"
                                    />
                                    <Button
                                        onClick={sendForm}
                                        dataPrimaryLink
                                        loading={isSubmitting}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Loading..." : "Generate Report"}
                                    </Button>
                                    <Button
                                        onClick={sendReport}
                                        dataPrimaryLink
                                        loading={isSubmitting}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Loading..." : "Send Report"}
                                    </Button>
                                    <Button
                                        onClick={resendFailures}
                                        dataPrimaryLink
                                        loading={isSubmitting}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Loading..." : "Retry failures"}
                                    </Button>
                                </BlockStack>
                            </Form>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {actionData && (
                    <Layout.Section>
                        {actionData.error ? (
                            <Banner tone="critical">
                                <Text as="p">{actionData.error}</Text>
                            </Banner>
                        ) : actionData.success ? (
                            <Card>
                                <BlockStack gap="400">
                                    <Banner tone="success">
                                        <Text as="p">Report generated successfully!</Text>
                                    </Banner>
                                    {actionData.report && <div style={{
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
                                            {JSON.stringify(actionData.report, null, 2)}
                                        </pre>
                                    </div>
                                    }

                                    {actionData.response &&
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
                                                {JSON.stringify(actionData.response, null, 2)}
                                            </pre>
                                        </div>}
                                </BlockStack>
                            </Card>
                        ) : null}
                    </Layout.Section>
                )}
            </Layout>
        </Page >
    );
}