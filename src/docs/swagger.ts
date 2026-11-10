import swaggerJsdoc from "swagger-jsdoc";
import { prebuiltPaths } from "./prebuiltPaths.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Task Management API",
      version: "1.0.0",
      description:
        "Comprehensive RESTful API for managing tasks with JWT authentication, role-based authorization, Zod validation, pagination, filtering, and sorting.",
    },

    servers: [
      {
        url: "/api/v1",
        description: "Current Domain Relative URL",
      },
      {
        url: "http://localhost:3000/api/v1",
        description: "Local Development Server",
      },
    ],

    tags: [
      {
        name: "Authentication",
        description: "User registration and login endpoints",
      },
      {
        name: "Tasks",
        description: "Task CRUD operations, search, filtering, and pagination",
      },
      {
        name: "Users",
        description: "User profile and authentication status",
      },
      {
        name: "Admin",
        description: "Role-protected admin endpoints",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token (e.g. Bearer <token>)",
        },
      },

      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              example: "user",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2026-11-10T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2026-11-10T00:00:00.000Z",
            },
          },
        },

        Task: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "5cebb4a8-6319-445f-9b69-cf5d38b1e86c",
            },
            userId: {
              type: "string",
              format: "uuid",
              example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            },
            title: {
              type: "string",
              example: "Complete Node.js Roadmap",
            },
            description: {
              type: "string",
              nullable: true,
              example: "Finish CRUD, validation, and documentation",
            },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed"],
              example: "in_progress",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              example: "high",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-12-01T12:00:00.000Z",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2026-11-10T01:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2026-11-10T01:05:00.000Z",
            },
          },
        },

        CreateTaskInput: {
          type: "object",
          required: ["title"],
          properties: {
            title: {
              type: "string",
              minLength: 1,
              maxLength: 150,
              example: "Learn Docker & Kubernetes",
            },
            description: {
              type: "string",
              nullable: true,
              maxLength: 1000,
              example: "Containerize the task management API",
            },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed"],
              default: "pending",
              example: "pending",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              default: "medium",
              example: "medium",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-12-15T12:00:00.000Z",
            },
          },
        },

        UpdateTaskInput: {
          type: "object",
          properties: {
            title: {
              type: "string",
              minLength: 1,
              maxLength: 150,
              example: "Updated task title",
            },
            description: {
              type: "string",
              nullable: true,
              maxLength: 1000,
              example: "Updated task description",
            },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed"],
              example: "completed",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              example: "high",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-12-30T12:00:00.000Z",
            },
          },
        },

        PaginationMeta: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            total: {
              type: "integer",
              example: 25,
            },
            totalPages: {
              type: "integer",
              example: 3,
            },
            hasNextPage: {
              type: "boolean",
              example: true,
            },
            hasPrevPage: {
              type: "boolean",
              example: false,
            },
          },
        },

        ErrorResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "fail",
            },
            message: {
              type: "string",
              example: "Validation failed",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    example: "title",
                  },
                  message: {
                    type: "string",
                    example: "Title cannot be empty",
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  apis: [
    "./src/modules/**/*.ts",
    "./src/modules/**/*.route.ts",
    "./dist/modules/**/*.js",
    "./dist/modules/**/*.route.js",
  ],
};

const jsdocSpec = swaggerJsdoc(options) as Record<string, any>;

// Combine or fallback to prebuiltPaths when running on serverless platforms (Vercel)
export const swaggerSpec = {
  ...jsdocSpec,
  paths:
    jsdocSpec.paths && Object.keys(jsdocSpec.paths).length > 0
      ? jsdocSpec.paths
      : prebuiltPaths,
};
