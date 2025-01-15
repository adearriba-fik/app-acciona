export class TimezoneManager {
    /**
     * Creates a UTC Date that will represent the target time in the specified timezone
     */
    static createInTimezone(
        year: number,
        month: number,
        day: number,
        hour: number,
        minute: number,
        second: number,
        millisecond: number,
        timezone: string
    ): Date {
        // Create the date string without forcing UTC
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` +
            `T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}.${millisecond.toString().padStart(3, '0')}`;

        // Create a date object in the target timezone
        const options: Intl.DateTimeFormatOptions = {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
            hour12: false
        };

        // First, create the date assuming local time
        let date = new Date(dateStr);

        // Get the timezone offset for this specific date
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(date);

        // Extract all components
        const actualYear = parseInt(parts.find(p => p.type === 'year')!.value);
        const actualMonth = parseInt(parts.find(p => p.type === 'month')!.value);
        const actualDay = parseInt(parts.find(p => p.type === 'day')!.value);
        const actualHour = parseInt(parts.find(p => p.type === 'hour')!.value);
        const actualMinute = parseInt(parts.find(p => p.type === 'minute')!.value);
        const actualSecond = parseInt(parts.find(p => p.type === 'second')!.value);

        // If any component doesn't match, adjust the time
        if (actualYear !== year ||
            actualMonth !== month ||
            actualDay !== day ||
            actualHour !== hour ||
            actualMinute !== minute ||
            actualSecond !== second) {

            // Calculate the difference in milliseconds
            const targetDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
            const offset = targetDate.getTime() - date.getTime();

            // Adjust the date
            date = new Date(date.getTime() + offset);
        }

        return date;
    }

    /**
     * Formats a date in the specified timezone using the provided format
     */
    static formatInTimezone(
        date: Date,
        timezone: string,
        options: Intl.DateTimeFormatOptions = {}
    ): string {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            ...options
        });
        return formatter.format(date);
    }

    /**
     * Gets date parts in the specified timezone
     */
    static getPartsInTimezone(
        date: Date,
        timezone: string
    ): Record<string, string> {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
            hour12: false
        });

        const parts = formatter.formatToParts(date);
        return parts.reduce((acc, part) => {
            if (part.type !== 'literal') {
                acc[part.type] = part.value;
            }
            return acc;
        }, {} as Record<string, string>);
    }

    /**
     * Formats a date as YYYYMMDD in the specified timezone
     */
    static formatYYYYMMDD(date: Date): string {
        return date.getUTCFullYear().toString() +
            (date.getUTCMonth() + 1).toString().padStart(2, '0') +
            date.getUTCDate().toString().padStart(2, '0');
    }

    /**
     * Creates a date representing the end of a month in the specified timezone
     */
    static getMonthEnd(year: number, month: number, timezone: string): Date {
        const daysInMonth = this.getDaysInMonth(year, month);
        return this.createInTimezone(year, month, daysInMonth, 23, 59, 59, 999, timezone);
    }

    /**
     * Creates a date representing the start of a month in the specified timezone
     */
    static getMonthStart(year: number, month: number, timezone: string): Date {
        return this.createInTimezone(year, month, 1, 0, 0, 0, 0, timezone);
    }

    /**
     * Helper method to get the number of days in a month
     */
    static getDaysInMonth(year: number, month: number): number {
        // Note: month is 1-based here
        return new Date(year, month, 0).getDate();
    }

    /**
     * Validates if a timezone name is valid
     */
    static isValidTimezone(timezone: string): boolean {
        try {
            Intl.DateTimeFormat('en-US', { timeZone: timezone });
            return true;
        } catch (e) {
            return false;
        }
    }
}