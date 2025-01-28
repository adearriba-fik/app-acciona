import { IScheduledTask, ITaskScheduler } from 'app/modules/reports/domain/ports/ITaskScheduler';
import { ScheduledTask, schedule as cronSchedule, validate as validateCron } from 'node-cron';
import cronParser from 'cron-parser';
import { ILogger } from 'app/modules/shared/infrastructure/logging/ILogger';

export interface CronTaskSchedulerOptions {
    logger?: ILogger,
    timezone?: string,
}

export class CronTaskScheduler implements ITaskScheduler {
    private readonly logger?: ILogger;
    private readonly timezone?: string;

    private jobs: Map<string, {
        definition: IScheduledTask;
        instance: ScheduledTask;
    }>;

    constructor({ logger, timezone }: CronTaskSchedulerOptions) {
        this.jobs = new Map();
        this.logger = logger;
        this.timezone = timezone;
    }

    addJob(name: string, cronExpression: string, task: () => Promise<void> | void): void {
        if (this.jobs.has(name)) {
            throw new Error(`Job ${name} already exists`);
        }

        if (!validateCron(cronExpression)) {
            throw new Error(`Invalid cron expression: ${cronExpression}`);
        }

        const wrappedTask = async () => {
            const jobData = this.jobs.get(name);
            if (!jobData || jobData.definition.isRunning) return;

            jobData.definition.isRunning = true;
            jobData.definition.lastRun = new Date();

            try {
                this.logger?.debug('Starting cron task', {
                    name: jobData.definition.name
                });

                await Promise.resolve(task());
                jobData.definition.runCount += 1;
                jobData.definition.nextRun = this.calculateNextRunTime(cronExpression, this.timezone);

                this.logger?.debug('Cron task executed successfully', {
                    name: jobData.definition.name,
                    runCount: jobData.definition.runCount,
                    nextRun: jobData.definition.nextRun,
                });

            } catch (error) {
                this.logger?.debug('Error in cron task', {
                    name: jobData.definition.name,
                    error
                });
                throw error;
            } finally {
                jobData.definition.isRunning = false;
            }
        };

        const cronTask = cronSchedule(cronExpression, wrappedTask, {
            runOnInit: false,
            timezone: this.timezone,
            scheduled: false,
        });

        const job: IScheduledTask = {
            name,
            cronExpression,
            task,
            isRunning: false,
            runCount: 0,
        };

        this.jobs.set(name, {
            definition: job,
            instance: cronTask
        });

        this.logger?.info('Cron task created', {
            name,
            cronExpression,
            nextRun: this.calculateNextRunTime(cronExpression, this.timezone),
        });

        cronTask.start();
    }

    removeJob(name: string): boolean {
        const job = this.jobs.get(name);
        if (!job) return false;

        job.instance.stop();
        this.jobs.delete(name);

        this.logger?.info('Cron task removed', {
            name,
            cronExpression: job.definition.cronExpression,
        });
        return true;
    }

    getJob(name: string): IScheduledTask | undefined {
        return this.jobs.get(name)?.definition;
    }

    getAllJobs(): IScheduledTask[] {
        return Array.from(this.jobs.values()).map(job => job.definition);
    }

    startJob(name: string): boolean {
        const job = this.jobs.get(name);
        if (!job) return false;

        job.instance.start();
        this.logger?.info('Cron task started', {
            name,
            cronExpression: job.definition.cronExpression,
        });
        return true;
    }

    stopJob(name: string): boolean {
        const job = this.jobs.get(name);
        if (!job) return false;

        job.instance.stop();
        this.logger?.info('Cron task stopped', {
            name,
            cronExpression: job.definition.cronExpression,
        });

        return true;
    }

    private calculateNextRunTime(cronExpression: string, timezone?: string): Date | undefined {
        try {
            const options = timezone ? { tz: timezone } : {};
            const interval = cronParser.parseExpression(cronExpression, options);
            return interval.next().toDate();
        } catch (error) {
            console.error(`Error calculating next run time for cron expression "${cronExpression}":`, error);
            return undefined;
        }
    }
}