import { CosmosClient, Container, Database, ContainerRequest } from "@azure/cosmos";

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

    public async getContainer(containerId: string, body?: Partial<ContainerRequest>): Promise<Container> {
        if (!this.containers.has(containerId)) {
            await this.database.containers.createIfNotExists({
                ...body,
                id: containerId,
            });
            const container = this.database.container(containerId);
            await container.read();
            this.containers.set(containerId, container);
        }
        return this.containers.get(containerId)!;
    }
}