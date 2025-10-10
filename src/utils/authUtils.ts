/**
 * Authentication utility functions
 */

/**
 * Handles authentication errors (401 Unauthorized)
 * Clears local storage and reloads the page to redirect to login
 * @param error - The error object from axios
 * @returns true if it was a 401 error and was handled, false otherwise
 */
export const handleAuthError = (error: any): boolean => {
    // Check if it's a 401 Unauthorized error
    if (error?.response?.status === 401 || error?.status === 401) {
        console.log(
            "401 Unauthorized error detected. Clearing local storage and reloading page..."
        );

        // Clear all data from local storage
        localStorage.clear();

        // Also clear session storage if it exists
        if (typeof sessionStorage !== "undefined") {
            sessionStorage.clear();
        }

        // Show a brief message to the user
        if (typeof window !== "undefined") {
            // You can customize this message
            console.log("Session expired. Redirecting to login page...");
        }

        // Reload the page after a short delay to ensure storage is cleared
        setTimeout(() => {
            window.location.reload();
        }, 100);

        return true; // Error was handled
    }

    return false; // Not a 401 error
};

/**
 * Clears all authentication data from storage
 * Useful for logout functionality
 */
export const clearAuthData = (): void => {
    localStorage.clear();
    if (typeof sessionStorage !== "undefined") {
        sessionStorage.clear();
    }
    console.log("Authentication data cleared");
};

/**
 * Checks if user is authenticated by verifying token exists
 * @returns true if authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
    const token = localStorage.getItem("token");
    return !!token;
};

/**
 * Gets the current authentication token
 * @returns token string or null if not found
 */
export const getAuthToken = (): string | null => {
    return localStorage.getItem("token");
};

/**
 * Gets the current user role
 * @returns role string or null if not found
 */
export const getUserRole = (): string | null => {
    return localStorage.getItem("role");
};
