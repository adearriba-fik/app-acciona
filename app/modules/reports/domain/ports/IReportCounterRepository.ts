export interface IReportCounterRepository {
    getNextIdentifier(): Promise<number>;
}