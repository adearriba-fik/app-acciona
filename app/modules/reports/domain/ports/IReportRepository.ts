import { ReportDocument, ReportStatus } from '../entities/ReportDocument';

export interface IReportRepository {
    save(report: ReportDocument): Promise<void>;
    saveWithCounter(report: Omit<ReportDocument, 'identifier'>): Promise<ReportDocument>;
    findByYearAndMonth(year: number, month: number): Promise<ReportDocument | null>;
    findByStatus(status: ReportStatus): AsyncIterableIterator<ReportDocument>;
    updateStatus(id: string, status: ReportStatus, error?: string): Promise<void>;
}