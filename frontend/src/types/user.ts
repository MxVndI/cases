export interface User {
  id: string;
  email: string;
  nickname: string;
  status: "active" | "blocked";
  role?: "user" | "admin" | "superadmin";
  balance?: number;
  created_at?: string;
  registeredAt?: string;
}

