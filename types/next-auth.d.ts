import { UserRole } from "./index";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
      role: UserRole;
      name?: string | null;
    };
  }

  interface User {
    id: string;
    phone: string;
    role: UserRole;
    name?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    phone?: string;
  }
}
