export const prebuiltPaths = {
  "/users/protected": {
    "get": {
      "summary": "Verify authentication token",
      "description": "Simple test route to verify if the provided JWT Bearer token is valid.",
      "tags": [
        "Users"
      ],
      "security": [
        {
          "BearerAuth": []
        }
      ],
      "responses": {
        "200": {
          "description": "Token is valid",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": true
                  },
                  "message": {
                    "type": "string",
                    "example": "Authenticated successfully"
                  },
                  "user": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string",
                        "format": "uuid"
                      },
                      "role": {
                        "type": "string",
                        "example": "user"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "401": {
          "description": "Missing or invalid token",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    }
  },
  "/users/me": {
    "get": {
      "summary": "Get current authenticated user",
      "description": "Retrieve detailed profile information of the currently logged-in user.",
      "tags": [
        "Users"
      ],
      "security": [
        {
          "BearerAuth": []
        }
      ],
      "responses": {
        "200": {
          "description": "Current user profile retrieved successfully",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": true
                  },
                  "data": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            }
          }
        },
        "401": {
          "description": "Unauthorized",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    }
  },
  "/tasks": {
    "get": {
      "summary": "Retrieve user tasks",
      "description": "Get paginated list of tasks belonging to the authenticated user with optional filtering, searching, and sorting.",
      "tags": [
        "Tasks"
      ],
      "security": [
        {
          "BearerAuth": []
        }
      ],
      "parameters": [
        {
          "in": "query",
          "name": "page",
          "schema": {
            "type": "integer",
            "minimum": 1,
            "default": 1
          },
          "description": "Page number for pagination"
        },
        {
          "in": "query",
          "name": "limit",
          "schema": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "default": 10
          },
          "description": "Number of tasks per page"
        },
        {
          "in": "query",
          "name": "status",
          "schema": {
            "type": "string",
            "enum": [
              "pending",
              "in_progress",
              "completed"
            ]
          },
          "description": "Filter tasks by status"
        },
        {
          "in": "query",
          "name": "priority",
          "schema": {
            "type": "string",
            "enum": [
              "low",
              "medium",
              "high"
            ]
          },
          "description": "Filter tasks by priority"
        },
        {
          "in": "query",
          "name": "search",
          "schema": {
            "type": "string"
          },
          "description": "Search keyword within task titles (case-insensitive)"
        },
        {
          "in": "query",
          "name": "sortBy",
          "schema": {
            "type": "string",
            "enum": [
              "createdAt",
              "dueDate",
              "title",
              "priority"
            ],
            "default": "createdAt"
          },
          "description": "Field to sort by"
        },
        {
          "in": "query",
          "name": "sortOrder",
          "schema": {
            "type": "string",
            "enum": [
              "asc",
              "desc"
            ],
            "default": "desc"
          },
          "description": "Sort direction"
        }
      ],
      "responses": {
        "200": {
          "description": "List of tasks retrieved successfully",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "example": "success"
                  },
                  "results": {
                    "type": "integer",
                    "example": 2
                  },
                  "pagination": {
                    "$ref": "#/components/schemas/PaginationMeta"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "tasks": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/Task"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Invalid query parameters",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "401": {
          "description": "Unauthorized - missing or invalid token",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    },
    "post": {
      "summary": "Create a new task",
      "description": "Create a task for the currently authenticated user.",
      "tags": [
        "Tasks"
      ],
      "security": [
        {
          "BearerAuth": []
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/CreateTaskInput"
            }
          }
        }
      },
      "responses": {
        "201": {
          "description": "Task created successfully",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "example": "success"
                  },
                  "message": {
                    "type": "string",
                    "example": "Task created successfully"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "task": {
                        "$ref": "#/components/schemas/Task"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Validation error",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "401": {
          "description": "Unauthorized",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    }
  },
  "/tasks/{id}": {
    "get": {
      "summary": "Get a task by ID",
      "description": "Retrieve details of a specific task belonging to the authenticated user.",
      "tags": [
        "Tasks"
      ],
      "security": [
        {
          "BearerAuth": []
        }
      ],
      "parameters": [
        {
          "in": "path",
          "name": "id",
          "required": true,
          "schema": {
            "type": "string",
            "format": "uuid"
          },
          "description": "Task UUID"
        }
      ],
      "responses": {
        "200": {
          "description": "Task found and returned",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "example": "success"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "task": {
                        "$ref": "#/components/schemas/Task"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Invalid UUID format",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "401": {
          "description": "Unauthorized",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "404": {
          "description": "Task not found",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    },
    "patch": {
      "summary": "Update a task",
      "description": "Partially update editable fields of a task owned by the user.",
      "tags": [
        "Tasks"
      ],
      "security": [
        {
          "BearerAuth": []
        }
      ],
      "parameters": [
        {
          "in": "path",
          "name": "id",
          "required": true,
          "schema": {
            "type": "string",
            "format": "uuid"
          },
          "description": "Task UUID"
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/UpdateTaskInput"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Task updated successfully",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "example": "success"
                  },
                  "message": {
                    "type": "string",
                    "example": "Task updated successfully"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "task": {
                        "$ref": "#/components/schemas/Task"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Validation error or no fields provided",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "401": {
          "description": "Unauthorized",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "404": {
          "description": "Task not found",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    },
    "delete": {
      "summary": "Delete a task",
      "description": "Permanently remove a task owned by the user.",
      "tags": [
        "Tasks"
      ],
      "security": [
        {
          "BearerAuth": []
        }
      ],
      "parameters": [
        {
          "in": "path",
          "name": "id",
          "required": true,
          "schema": {
            "type": "string",
            "format": "uuid"
          },
          "description": "Task UUID"
        }
      ],
      "responses": {
        "200": {
          "description": "Task deleted successfully",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "example": "success"
                  },
                  "message": {
                    "type": "string",
                    "example": "Task deleted successfully"
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Invalid UUID format",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "401": {
          "description": "Unauthorized",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "404": {
          "description": "Task not found",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    }
  },
  "/auth/register": {
    "post": {
      "summary": "Register a new user",
      "description": "Create a new user account with name, unique email, and password.",
      "tags": [
        "Authentication"
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": [
                "name",
                "email",
                "password"
              ],
              "properties": {
                "name": {
                  "type": "string",
                  "minLength": 2,
                  "maxLength": 100,
                  "example": "John Doe"
                },
                "email": {
                  "type": "string",
                  "format": "email",
                  "example": "john@example.com"
                },
                "password": {
                  "type": "string",
                  "minLength": 8,
                  "maxLength": 72,
                  "example": "StrongPassword123!"
                }
              }
            }
          }
        }
      },
      "responses": {
        "201": {
          "description": "User registered successfully",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "example": "success"
                  },
                  "message": {
                    "type": "string",
                    "example": "User registered successfully"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "user": {
                        "$ref": "#/components/schemas/User"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Validation error",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "409": {
          "description": "Email already in use",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "example": "fail"
                  },
                  "message": {
                    "type": "string",
                    "example": "A user with this email already exists"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "/auth/login": {
    "post": {
      "summary": "Log in an existing user",
      "description": "Authenticate user credentials and receive a JWT access token.",
      "tags": [
        "Authentication"
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": [
                "email",
                "password"
              ],
              "properties": {
                "email": {
                  "type": "string",
                  "format": "email",
                  "example": "john@example.com"
                },
                "password": {
                  "type": "string",
                  "example": "StrongPassword123!"
                }
              }
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Login successful, returns JWT token",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "example": "success"
                  },
                  "message": {
                    "type": "string",
                    "example": "Login successful"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "accessToken": {
                        "type": "string",
                        "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      },
                      "user": {
                        "$ref": "#/components/schemas/User"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Validation error",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "401": {
          "description": "Invalid email or password",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "example": "fail"
                  },
                  "message": {
                    "type": "string",
                    "example": "Invalid email or password"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "/admin": {
    "get": {
      "summary": "Admin-only dashboard endpoint",
      "description": "Protected route accessible only to users with the 'admin' role.",
      "tags": [
        "Admin"
      ],
      "security": [
        {
          "BearerAuth": []
        }
      ],
      "responses": {
        "200": {
          "description": "Welcome message for admin",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": true
                  },
                  "message": {
                    "type": "string",
                    "example": "Welcome Admin"
                  }
                }
              }
            }
          }
        },
        "401": {
          "description": "Unauthorized - token missing or invalid",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "403": {
          "description": "Forbidden - user does not have admin permissions",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "example": "fail"
                  },
                  "message": {
                    "type": "string",
                    "example": "You do not have permission to perform this action"
                  }
                }
              }
            }
          }
        }
      }
    }
  }
} as const;
