import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CronTaskScheduler } from './CronTaskScheduler';

describe('CronTaskScheduler Integration Tests', () => {
    let scheduler: CronTaskScheduler;

    beforeEach(() => {
        vi.useFakeTimers();
        scheduler = new CronTaskScheduler({
            timezone: 'Europe/Madrid',
        });
    });

    afterEach(() => {
        vi.clearAllTimers();
        scheduler.getAllJobs().forEach(job => {
            scheduler.removeJob(job.name);
        });
    });

    it('should execute a job on schedule', async () => {
        const task = vi.fn();
        const cronExpression = '* * * * * *'; // Run every second

        scheduler.addJob('realJob', cronExpression, task);

        // Advance timers to trigger the job
        vi.advanceTimersByTime(2000);

        expect(task).toHaveBeenCalled();

    }, 3000);

    it('should execute multiple jobs on the same schedule', async () => {
        const task1 = vi.fn();
        const task2 = vi.fn();
        const cronExpression = '* * * * * *'; // Run every second

        scheduler.addJob('realJob1', cronExpression, task1);
        scheduler.addJob('realJob2', cronExpression, task2);

        // Advance timers to trigger the jobs
        vi.advanceTimersByTime(2000);

        expect(task1).toHaveBeenCalled();
        expect(task2).toHaveBeenCalled();
    }, 3000);

    it('should handle async jobs', async () => {
        vi.useRealTimers();
        let asyncTaskCompleted = false;

        const asyncTask = async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            asyncTaskCompleted = true;
        };

        const cronExpression = '* * * * * *'; // Run every second

        scheduler.addJob('asyncJob', cronExpression, asyncTask);

        // Advance time to trigger the job and allow the async task to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        expect(asyncTaskCompleted).toBe(true);
    }, 5000);

    it('should properly track job running state', async () => {
        vi.useRealTimers();

        const longRunningTask = async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
        };

        const cronExpression = '* * * * * *'; // Run every second

        scheduler.addJob('stateJob', cronExpression, longRunningTask);

        // Advance timers to trigger the job
        await new Promise(resolve => setTimeout(resolve, 1000));

        const job = scheduler.getJob('stateJob');
        expect(job?.isRunning).toBe(true);

        // Advance timers to allow the job to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        expect(job?.isRunning).toBe(false);

    }, 3000);

    it('should throw an error when adding a job with an invalid cron expression', () => {
        const invalidCronExpression = 'invalid';
        expect(() => {
            scheduler.addJob('invalidJob', invalidCronExpression, vi.fn());
        }).toThrow();
    });

    it('should return false when removing a non-existent job', () => {
        expect(scheduler.removeJob('nonExistentJob')).toBe(false);
    });

    it('should return false when starting a non-existent job', () => {
        expect(scheduler.startJob('nonExistentJob')).toBe(false);
    });

    it('should stop a running job', async () => {
        const task = vi.fn();
        const cronExpression = '* * * * * *'; // Run every second

        scheduler.addJob('stopJob', cronExpression, task);
        scheduler.stopJob('stopJob');

        // Advance timers to ensure the job does not run
        vi.advanceTimersByTime(2000);

        expect(task).not.toHaveBeenCalled();
    }, 3000);

    it('should return all jobs', () => {
        const task = vi.fn();
        const cronExpression = '* * * * * *'; // Run every second

        scheduler.addJob('job1', cronExpression, task);
        scheduler.addJob('job2', cronExpression, task);

        const jobs = scheduler.getAllJobs();
        expect(jobs).toHaveLength(2);
    });
});