/**
 * Gets the start of a month in Madrid timezone (handles CET/CEST automatically)
 * @param year The year
 * @param month The month (1-12)
 * @returns Date object in UTC representing start of month in Madrid time
 */
export function getMonthStartMadrid(year: number, month: number): Date {
    // Create date string in Madrid timezone
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-01T00:00:00`;
    // Convert to Date object considering Madrid timezone
    const date = new Date(dateStr);
    // Get UTC timestamp considering Madrid timezone offset
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
    return utcDate;
}

/**
 * Gets the end of a month in Madrid timezone (handles CET/CEST automatically)
 * @param year The year
 * @param month The month (1-12)
 * @returns Date object in UTC representing end of month in Madrid time
 */
export function getMonthEndMadrid(year: number, month: number): Date {
    // Get the last day of the month
    const lastDay = new Date(year, month, 0).getDate();
    // Create date string in Madrid timezone
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay}T23:59:59.999`;
    // Convert to Date object considering Madrid timezone
    const date = new Date(dateStr);
    // Get UTC timestamp considering Madrid timezone offset
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
    return utcDate;
}

/**
 * Formats a UTC date to YYYYMMDD considering Madrid timezone
 * @param date The UTC Date object
 * @returns String in YYYYMMDD format according to Madrid time
 */
export function formatDateYYYYMMDD(date: Date): string {
    // Convert the UTC date to Madrid time
    const madridDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
    const year = madridDate.getFullYear();
    const month = (madridDate.getMonth() + 1).toString().padStart(2, '0');
    const day = madridDate.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * Validates if a date is the last day of its month in Madrid timezone
 * @param date The UTC Date object to check
 * @returns boolean indicating if it's the last day of the month
 */
export function isLastDayOfMonth(date: Date): boolean {
    const madridDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
    const lastDay = new Date(madridDate.getFullYear(), madridDate.getMonth() + 1, 0).getDate();
    return madridDate.getDate() === lastDay;
}

/**
 * Gets the current date and time in Madrid timezone
 * @returns Date object representing current Madrid time
 */
export function getCurrentMadridDate(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
}