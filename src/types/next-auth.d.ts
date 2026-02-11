import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email?: string | null;
      image?: string | null;
      discordId?: string;
    };
  }

  interface User {
    discordId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
  }
}
