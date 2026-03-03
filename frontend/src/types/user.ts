export interface User {
  id: string;
  email: string;
  trade_link?: string;
  nickname: string;
  status: "active" | "blocked";
  role?: "user" | "admin";
  balance?: number;
  registeredAt?: string;
}

