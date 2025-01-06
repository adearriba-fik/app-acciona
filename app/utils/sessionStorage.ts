import { Session } from "@shopify/shopify-api";
import { type SessionStorage } from "@shopify/shopify-app-session-storage";

export class InMemorySessionStorageDecorator implements SessionStorage {
    private sessions: Session[] = [];
    private storage: SessionStorage;

    constructor(storage: SessionStorage) {
        this.storage = storage;
    }

    storeSession(session: Session): Promise<boolean> {
        this.sessions.push(session);
        return this.storage.storeSession(session);
    }
    async loadSession(id: string): Promise<Session | undefined> {
        const session = this.sessions.find(s => s.id === id);
        if (session) return session;

        const loadSession = await this.storage.loadSession(id);
        if (loadSession) this.sessions.push(loadSession);

        return loadSession;
    }
    deleteSession(id: string): Promise<boolean> {
        this.sessions = this.sessions.filter(s => s.id !== id);
        return this.storage.deleteSession(id);
    }
    deleteSessions(ids: string[]): Promise<boolean> {
        for (let index = 0; index < ids.length; index++) {
            const id = ids[index];
            this.sessions = this.sessions.filter(s => s.id !== id);
        }
        return this.storage.deleteSessions(ids);
    }
    findSessionsByShop(shop: string): Promise<Session[]> {
        const sessions = this.sessions.filter(s => s.shop === shop);
        if (sessions) return new Promise(resolve => resolve(sessions));

        return this.storage.findSessionsByShop(shop);
    }
}