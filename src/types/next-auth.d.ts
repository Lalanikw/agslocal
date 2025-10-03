import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "teacher" | "student";
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "teacher" | "student";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "admin" | "teacher" | "student";
  }
}