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
    const status = error?.response?.status ?? error?.status;
    const message: string | undefined =
        error?.response?.data?.message ?? error?.message;

    // Check if it's an auth-related error:
    // - 401 Unauthorized
    // - or backend message like "Expired token"
    const isAuthError =
        status === 401 ||
        (typeof message === "string" &&
            message.toLowerCase().includes("expired token"));

    if (isAuthError) {
        console.log(
            "Auth error detected (401 / Expired token). Clearing storage and redirecting to login..."
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

        // Redirect to login after a short delay to ensure storage is cleared
        setTimeout(() => {
            if (typeof window !== "undefined") {
                if (window.location.pathname === "/login") {
                    window.location.reload();
                } else {
                    window.location.replace("/login");
                }
            }
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
