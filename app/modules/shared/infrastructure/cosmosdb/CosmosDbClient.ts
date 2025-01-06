import { CosmosClient, Container, Database } from "@azure/cosmos";

export class CosmosDbClient {
    private static instance: CosmosDbClient;
    private client: CosmosClient;
    private database: Database;
    private containers: Map<string, Container> = new Map();

    private constructor() {
        this.client = new CosmosClient({
            endpoint: process.env.COSMOS_ENDPOINT!,
            key: process.env.COSMOS_KEY!
        });
        this.database = this.client.database(process.env.COSMOS_DBNAME!);
    }

    public static getInstance(): CosmosDbClient {
        if (!CosmosDbClient.instance) {
            CosmosDbClient.instance = new CosmosDbClient();
        }
        return CosmosDbClient.instance;
    }

    public async getContainer(containerId: string): Promise<Container> {
        if (!this.containers.has(containerId)) {
            await this.database.containers.createIfNotExists({
                id: containerId,
            });
            const container = this.database.container(containerId);
            await container.read();
            this.containers.set(containerId, container);
        }
        return this.containers.get(containerId)!;
    }
}