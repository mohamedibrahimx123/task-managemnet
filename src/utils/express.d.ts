import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "user" | "admin";
      };
    }
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      role: "user" | "admin";
    };
  }
}

export {};
