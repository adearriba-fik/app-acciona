import { TicketDocument } from '../../../tickets/domain/entities/Ticket';

export interface ITicketRepository {
    findByYearAndMonth(year: number, month: number): AsyncIterableIterator<TicketDocument>
}