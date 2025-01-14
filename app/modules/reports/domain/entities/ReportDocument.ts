import { MonthlyReport } from "./MonthlyReport";

export type ReportStatus = 'PENDING' | 'SENDING' | 'SUCCESS' | 'FAILURE';

export interface ReportDocument {
    id: string;
    type: 'report';
    year: number;
    month: number;
    identifier: number;
    status: ReportStatus;
    retryCount: number;
    lastRetryDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    report: MonthlyReport;
    error?: string;
    [key: string]: any;
}