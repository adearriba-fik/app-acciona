export interface JobDetail {
    name: string;
    cronExpression: string;
    running: boolean;
}

export interface JobTask {
    (): Promise<void> | void;
}