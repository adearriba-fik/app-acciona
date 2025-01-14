export interface ReportCounter {
    id: string;
    type: 'report_counter';
    currentValue: number;
    _etag?: string;
}