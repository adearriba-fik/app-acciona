import { MonthlyReport } from "../entities/MonthlyReport";

export interface IMonthlyReportGenerator {
    generateReport(year: number, month: number): Promise<MonthlyReport>;
}