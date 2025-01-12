/**
 * Rounds a number to 2 decimal places
 */
export function roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Converts a string amount to a number with 2 decimal places
 */
export function parseAmount(amount: string): number {
    return roundToTwoDecimals(parseFloat(amount));
}

/**
 * Safely adds two numbers maintaining 2 decimal places
 */
export function safeAdd(a: number, b: number): number {
    return roundToTwoDecimals(a + b);
}

/**
 * Safely multiplies two numbers maintaining 2 decimal places
 */
export function safeMultiply(a: number, b: number): number {
    return roundToTwoDecimals(a * b);
}

/**
 * Safely divides two numbers maintaining 2 decimal places
 */
export function safeDivide(a: number, b: number): number {
    return roundToTwoDecimals(a / b);
}