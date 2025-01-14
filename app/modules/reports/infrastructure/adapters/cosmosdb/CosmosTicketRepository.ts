import { Container } from "@azure/cosmos";
import { ITicketRepository } from "../../../domain/ports/ITicketRepository";
import { TicketDocument } from "../../../../tickets/domain/entities/Ticket";
import { ILogger } from "app/modules/shared/infrastructure/logging/ILogger";
import { getMonthEndMadrid, getMonthStartMadrid } from "app/modules/reports/domain/utils/date-utils";

export class CosmosTicketRepository implements ITicketRepository {
    constructor(
        private container: Container,
        private logger: ILogger
    ) { }

    async *findByYearAndMonth(year: number, month: number): AsyncIterableIterator<TicketDocument> {
        const startDate = getMonthStartMadrid(year, month);
        const endDate = getMonthEndMadrid(year, month);

        const querySpec = {
            query: "SELECT * FROM c WHERE c.year = @year AND c.created_at >= @startDate AND c.created_at <= @endDate ORDER BY c.id",
            parameters: [
                { name: "@year", value: year.toString() },
                { name: "@startDate", value: startDate.toISOString() },
                { name: "@endDate", value: endDate.toISOString() }
            ]
        };

        this.logger.debug('Querying tickets with parameters:', {
            year,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        const queryIterator = this.container.items.query<TicketDocument>(querySpec);

        while (queryIterator.hasMoreResults()) {
            const { resources } = await queryIterator.fetchNext();
            for (const ticket of resources) {
                yield ticket;
            }
        }
    }
}