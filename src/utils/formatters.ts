/**
 * Number formatting utilities
 */

/**
 * Formats a number string with spaces as thousands separators
 * Supports decimal numbers
 * @param value - The number string to format
 * @returns Formatted number string with spaces
 *
 * @example
 * formatNumber("3000000") // "3 000 000"
 * formatNumber("3000000.50") // "3 000 000.50"
 * formatNumber("1234567.89") // "1 234 567.89"
 */
export const formatNumber = (value: string): string => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, "");

    // Split by decimal point
    const parts = cleanValue.split(".");

    // Format the integer part with spaces
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    // If there's a decimal part, add it back
    if (parts.length > 1) {
        return `${integerPart}.${parts[1]}`;
    }

    return integerPart;
};

/**
 * Parses a formatted number string by removing spaces
 * @param value - The formatted number string
 * @returns Clean number string without spaces
 *
 * @example
 * parseNumber("3 000 000") // "3000000"
 * parseNumber("3 000 000.50") // "3000000.50"
 */
export const parseNumber = (value: string): string => {
    // Remove spaces and return clean number
    return value.replace(/\s/g, "");
};

/**
 * Formats currency with spaces as thousands separators
 * @param value - The number string to format
 * @param currency - Currency symbol (default: "")
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency("3000000", "₽") // "3 000 000 ₽"
 * formatCurrency("3000000.50", "$") // "3 000 000.50 $"
 */
export const formatCurrency = (
    value: string,
    currency: string = ""
): string => {
    const formatted = formatNumber(value);
    return currency ? `${formatted} ${currency}` : formatted;
};

/**
 * Validates if a string is a valid number
 * @param value - The string to validate
 * @returns True if valid number, false otherwise
 */
export const isValidNumber = (value: string): boolean => {
    const cleanValue = parseNumber(value);
    return !isNaN(parseFloat(cleanValue)) && isFinite(parseFloat(cleanValue));
};

/**
 * Formats a number for display with proper decimal places
 * @param value - The number string to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 *
 * @example
 * formatDecimal("3000000", 2) // "3 000 000.00"
 * formatDecimal("3000000.5", 2) // "3 000 000.50"
 */
export const formatDecimal = (value: string, decimals: number = 2): string => {
    const cleanValue = parseNumber(value);
    const num = parseFloat(cleanValue);

    if (isNaN(num)) return "0";

    const formatted = num.toFixed(decimals);
    return formatNumber(formatted);
};
