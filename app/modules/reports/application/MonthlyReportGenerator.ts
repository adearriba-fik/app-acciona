import { IMonthlyReportGenerator } from "../domain/ports/IMonthlyReportGenerator";
import { ITicketRepository } from "../domain/ports/ITicketRepository";
import { MonthlyReport, MonthlyReportHeader, CustomerPosition, IncomePosition, TaxPosition } from "../domain/entities/MonthlyReport";
import { TicketDocument } from "app/modules/tickets/domain/entities/Ticket";
import { roundToTwoDecimals } from "app/modules/tickets/domain/utils/money-utils";
import { ILogger } from "app/modules/shared/infrastructure/logging/ILogger";
import { TimezoneManager } from "../domain/utils/date-utils";

interface TaxLineGrouping {
    firstTicket: TicketDocument;
    lastTicket: TicketDocument;
    currency: string;
    taxGroups: Map<number, {
        totalPrice: number;
        totalTax: number;
        currency: string;
    }>;
    totalWithTax: number;
}

export class MonthlyReportGenerator implements IMonthlyReportGenerator {
    private readonly logger: ILogger;

    // Static values as per requirements
    private static readonly STATIC_VALUES = {
        SOCIEDAD: "H002",
        CLASE_DOCUMENTO: "Factura",
        CUENTA_CLIENTE: "Cliente",
        CENTRO_BENEFICIO: "CEBE",
        CUENTA_INGRESO: "7050000000",
        CUENTA_IMPUESTOS: "4770000000",
        ELEMENTO_PEP: "IMPUTACIÓN"
    };

    constructor(
        private readonly ticketRepository: ITicketRepository,
        baseLogger: ILogger
    ) {
        this.logger = baseLogger.child({
            handler: 'MonthlyReportGenerator',
        });
    }

    private formatAmount(amount: number): string {
        return amount.toFixed(2);
    }

    private formatTaxRate(rate: number): string {
        return `${(rate * 100).toFixed(0)}%`;
    }

    private async groupTicketsAndTaxLines(ticketsIterator: AsyncIterableIterator<TicketDocument>): Promise<TaxLineGrouping> {
        let firstTicket: TicketDocument | null = null;
        let lastTicket: TicketDocument | null = null;
        let currency: string | null = null;
        let totalWithTax: number = 0;

        const taxGroups = new Map<number, {
            totalPrice: number;
            totalTax: number;
            currency: string;
        }>();

        for await (const ticket of ticketsIterator) {
            if (!firstTicket) {
                firstTicket = ticket;
                currency = ticket.currency;
            }
            lastTicket = ticket;

            const multiplier = ticket.type === 'refund' ? -1 : 1;
            totalWithTax = roundToTwoDecimals(totalWithTax + (ticket.totalAmount * multiplier));

            for (const taxLine of ticket.tax_lines) {
                const group = taxGroups.get(taxLine.rate) || {
                    totalPrice: 0,
                    totalTax: 0,
                    currency: taxLine.currency
                };

                group.totalPrice = roundToTwoDecimals(group.totalPrice + (taxLine.price * multiplier));
                group.totalTax = roundToTwoDecimals(group.totalTax + (taxLine.tax * multiplier));

                taxGroups.set(taxLine.rate, group);
            }
        }

        if (!firstTicket || !lastTicket) {
            throw new Error('No tickets found for the specified period');
        }

        let totalAmount = 0;
        for (const group of taxGroups.values()) {
            totalAmount = roundToTwoDecimals(totalAmount + group.totalPrice + group.totalTax);
        }

        if (totalWithTax !== totalAmount) {
            throw new Error("Report total and detail doesn't match");
        }

        return {
            firstTicket,
            lastTicket,
            currency: currency!,
            taxGroups,
            totalWithTax
        };
    }

    async generateReport(year: number, month: number): Promise<MonthlyReport> {
        this.logger.info('Generating monthly report', { year, month });

        const { firstTicket, lastTicket, currency, taxGroups, totalWithTax } =
            await this.groupTicketsAndTaxLines(this.ticketRepository.findByYearAndMonth(year, month));

        const lastDayOfMonth = TimezoneManager.getMonthEnd(year, month, 'Europe/Madrid');
        const lastDayFormatted = TimezoneManager.formatYYYYMMDD(lastDayOfMonth);

        this.logger.info('Getting lastDayOfMonth', {
            year,
            month,
            lastDayOfMonth,
            lastDayFormatted,
        });

        const ticketRange = `${firstTicket.id}_${lastTicket.id}`;

        let positionIndex = 0;
        const posicionIngreso: IncomePosition[] = [];
        const posicionImpuestos: TaxPosition[] = [];

        const header: MonthlyReportHeader = {
            Fecha_documento: lastDayFormatted,
            Fecha_contable: lastDayFormatted,
            Ejercicio: year.toString(),
            Periodo: month.toString().padStart(2, '0'),
            Sociedad: MonthlyReportGenerator.STATIC_VALUES.SOCIEDAD,
            Clase_documento: MonthlyReportGenerator.STATIC_VALUES.CLASE_DOCUMENTO,
            Referencia: lastTicket.id,
            Texto_cabecera: `${firstTicket.id}_`,
            Fecha_IVA: lastDayFormatted
        };

        const customerPosition: CustomerPosition = {
            Posicion: (++positionIndex).toString(),
            Cuenta_cliente: MonthlyReportGenerator.STATIC_VALUES.CUENTA_CLIENTE,
            Cuenta: "",
            Importe: this.formatAmount(totalWithTax),
            Moneda: currency,
            Num_Asignacion: ticketRange,
            Texto_explicativo: "",
            Centro_beneficio: MonthlyReportGenerator.STATIC_VALUES.CENTRO_BENEFICIO
        };

        // Create positions from grouped data for income
        for (const [rate, group] of taxGroups.entries()) {
            if (group.totalPrice !== 0 || group.totalTax !== 0) {
                posicionIngreso.push({
                    Posicion: (++positionIndex).toString(),
                    Cuenta_ingreso: MonthlyReportGenerator.STATIC_VALUES.CUENTA_INGRESO,
                    Importe: this.formatAmount(-group.totalPrice), // Negative for accounting
                    Moneda: currency,
                    Indicador_IVA: this.formatTaxRate(rate),
                    Centro_beneficio: MonthlyReportGenerator.STATIC_VALUES.CENTRO_BENEFICIO,
                    Elemento_PEP: MonthlyReportGenerator.STATIC_VALUES.ELEMENTO_PEP,
                    Num_asignacion: ticketRange,
                    Texto_explicativo: ""
                });
            }
        }

        // Create positions from grouped data for taxes
        for (const [rate, group] of taxGroups.entries()) {
            if (group.totalPrice !== 0 || group.totalTax !== 0) {
                posicionImpuestos.push({
                    Posicion: (++positionIndex).toString(),
                    Cuenta_impuestos: MonthlyReportGenerator.STATIC_VALUES.CUENTA_IMPUESTOS,
                    Importe: this.formatAmount(-group.totalTax), // Negative for accounting
                    Moneda: currency,
                    Indicador_IVA: this.formatTaxRate(rate),
                    Num_asignacion: ticketRange,
                    Texto_explicativo: "",
                    Centro_beneficio: "",
                    Base_Imponible_IVA: this.formatAmount(Math.abs(group.totalPrice)) // Always positive
                });
            }
        }

        this.logger.info('Monthly report generated successfully', {
            year,
            month,
            ticketRange,
            totalAmount: totalWithTax
        });

        return {
            Factura: {
                Cabecera: header,
                Posicion_cliente: customerPosition,
                Posicion_ingreso: posicionIngreso,
                Posicion_impuestos: posicionImpuestos
            }
        };
    }
}