import { AdminApiContextWithoutRest } from "node_modules/@shopify/shopify-app-remix/dist/ts/server/clients";

const GET_ORDER_TAGS = `#graphql
    query GetOrderByOrderId($id: ID!) {
        order(id: $id) {
            id
            tags
        }
    }
`;

export async function getOrderTags(id: number, graphqlClient: AdminApiContextWithoutRest['graphql']): Promise<string[]> {
    const response = await graphqlClient(GET_ORDER_TAGS, {
        variables: {
            id: `gid://shopify/Order/${id}`,
        }
    });

    const { data } = await response.json();
    return data?.order?.tags ?? [];
}