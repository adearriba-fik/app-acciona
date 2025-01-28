export interface IScheduledTask {
    name: string;
    cronExpression: string;
    task: () => Promise<void> | void;
    isRunning: boolean;
    lastRun?: Date;
    nextRun?: Date;
    runCount: number;
}

export interface ITaskScheduler {
    /**
     * Adds a new job to the scheduler
     * @param name Unique identifier for the job
     * @param cronExpression The schedule expression for the job
     * @param task The function to be executed
     * @throws Error if a job with the given name already exists
     */
    addJob(name: string, cronExpression: string, task: () => Promise<void> | void): void;

    /**
     * Removes a job from the scheduler
     * @param name The name of the job to remove
     * @returns true if the job was removed, false if it didn't exist
     */
    removeJob(name: string): boolean;

    /**
     * Retrieves a specific job by name
     * @param name The name of the job to retrieve
     * @returns The scheduled task if found, undefined otherwise
     */
    getJob(name: string): IScheduledTask | undefined;

    /**
     * Retrieves all registered jobs
     * @returns Array of all scheduled tasks
     */
    getAllJobs(): IScheduledTask[];

    /**
     * Starts a specific job
     * @param name The name of the job to start
     * @returns true if the job was started, false if it doesn't exist
     */
    startJob(name: string): boolean;

    /**
     * Stops a specific job
     * @param name The name of the job to stop
     * @returns true if the job was stopped, false if it doesn't exist
     */
    stopJob(name: string): boolean;
}