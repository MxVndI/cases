import { Navigate } from "@tanstack/react-router";

// Register page now redirects to unified login flow
export function Register() {
    return <Navigate to="/login" />;
}
