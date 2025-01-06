export interface ITicketNumberGenerator {
    generateNext(): Promise<string>;
}