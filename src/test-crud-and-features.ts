import "dotenv/config";
import type { Server } from "http";
import { app } from "./app.js";
import { pool } from "./config/database.js";
import { generateAccessToken } from "./utils/jwt.js";
import { hashPassword } from "./utils/password.js";

const runTests = async () => {
  let server: Server | null = null;

  try {
    console.log("=== STARTING COMPREHENSIVE CRUD & INTEGRATION TESTS ===\n");

    // 1. Setup Test Users
    const passwordHash = await hashPassword("TestPassword123!");

    // Clean up previous test users and tasks
    await pool.query(
      "DELETE FROM users WHERE email IN ('test_task_user1@example.com', 'test_task_user2@example.com')",
    );

    const user1Res = await pool.query<{ id: string; role: "user" | "admin" }>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Test User 1', 'test_task_user1@example.com', $1, 'user')
       RETURNING id, role`,
      [passwordHash],
    );
    const user1 = user1Res.rows[0];

    const user2Res = await pool.query<{ id: string; role: "user" | "admin" }>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Test User 2', 'test_task_user2@example.com', $1, 'user')
       RETURNING id, role`,
      [passwordHash],
    );
    const user2 = user2Res.rows[0];

    const token1 = generateAccessToken(user1);
    const token2 = generateAccessToken(user2);

    console.log("✓ Test users & tokens created successfully");

    // 2. Start Ephemeral HTTP Server
    server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to start test server");
    }
    const baseUrl = `http://localhost:${address.port}/api/v1/tasks`;

    const headers1 = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token1}`,
    };

    const headers2 = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token2}`,
    };

    // ----------------------------------------------------
    // Test 1: Create Tasks (CRUD - Create)
    // ----------------------------------------------------
    console.log("\n--- Testing Task Creation (POST /tasks) ---");

    const task1Res = await fetch(baseUrl, {
      method: "POST",
      headers: headers1,
      body: JSON.stringify({
        title: "Complete Node.js Roadmap",
        description: "Finish tasks CRUD, validation, and pagination",
        status: "in_progress",
        priority: "high",
        dueDate: "2026-12-01T12:00:00Z",
      }),
    });
    const task1Json = await task1Res.json();
    console.log("Create Task 1 status:", task1Res.status);
    if (task1Res.status !== 201 || !task1Json.data.task.id) {
      throw new Error(`Task 1 creation failed: ${JSON.stringify(task1Json)}`);
    }
    const createdTask1 = task1Json.data.task;
    console.log("✓ Task 1 created with ID:", createdTask1.id);

    const task2Res = await fetch(baseUrl, {
      method: "POST",
      headers: headers1,
      body: JSON.stringify({
        title: "Learn Docker & Kubernetes",
        description: "Containerize the task management API",
        status: "pending",
        priority: "low",
        dueDate: "2026-12-15T12:00:00Z",
      }),
    });
    const task2Json = await task2Res.json();
    const createdTask2 = task2Json.data.task;
    console.log("✓ Task 2 created with ID:", createdTask2.id);

    const task3Res = await fetch(baseUrl, {
      method: "POST",
      headers: headers1,
      body: JSON.stringify({
        title: "Build Frontend UI with React",
        description: "Create nice dashboard for tasks",
        status: "completed",
        priority: "medium",
        dueDate: "2026-11-20T12:00:00Z",
      }),
    });
    const task3Json = await task3Res.json();
    const createdTask3 = task3Json.data.task;
    console.log("✓ Task 3 created with ID:", createdTask3.id);

    // ----------------------------------------------------
    // Test 2: Get All Tasks (Pagination defaults)
    // ----------------------------------------------------
    console.log("\n--- Testing Get All Tasks & Pagination (GET /tasks) ---");
    const listRes = await fetch(baseUrl, {
      method: "GET",
      headers: headers1,
    });
    const listJson = await listRes.json();
    console.log("List status:", listRes.status, "Results count:", listJson.results);
    if (listJson.results !== 3 || listJson.pagination.total !== 3) {
      throw new Error(`Expected 3 tasks, got: ${listJson.results}`);
    }
    console.log("✓ Get all tasks and pagination meta verified");

    // Test Pagination Limit & Page
    const pageRes = await fetch(`${baseUrl}?page=1&limit=2`, {
      method: "GET",
      headers: headers1,
    });
    const pageJson = await pageRes.json();
    console.log("Page 1 with limit 2 results:", pageJson.results, "totalPages:", pageJson.pagination.totalPages);
    if (pageJson.results !== 2 || pageJson.pagination.totalPages !== 2 || !pageJson.pagination.hasNextPage) {
      throw new Error(`Pagination check failed: ${JSON.stringify(pageJson.pagination)}`);
    }
    console.log("✓ Pagination (page=1, limit=2, hasNextPage=true) verified");

    // ----------------------------------------------------
    // Test 3: Filtering & Searching
    // ----------------------------------------------------
    console.log("\n--- Testing Filtering & Search ---");

    // Filter by Status: completed
    const filterStatusRes = await fetch(`${baseUrl}?status=completed`, {
      method: "GET",
      headers: headers1,
    });
    const filterStatusJson = await filterStatusRes.json();
    if (filterStatusJson.results !== 1 || filterStatusJson.data.tasks[0].status !== "completed") {
      throw new Error("Filter by status failed");
    }
    console.log("✓ Filter by status=completed passed (found:", filterStatusJson.data.tasks[0].title, ")");

    // Filter by Priority: high
    const filterPriorityRes = await fetch(`${baseUrl}?priority=high`, {
      method: "GET",
      headers: headers1,
    });
    const filterPriorityJson = await filterPriorityRes.json();
    if (filterPriorityJson.results !== 1 || filterPriorityJson.data.tasks[0].priority !== "high") {
      throw new Error("Filter by priority failed");
    }
    console.log("✓ Filter by priority=high passed (found:", filterPriorityJson.data.tasks[0].title, ")");

    // Search by Title: "Docker"
    const searchRes = await fetch(`${baseUrl}?search=Docker`, {
      method: "GET",
      headers: headers1,
    });
    const searchJson = await searchRes.json();
    if (searchJson.results !== 1 || !searchJson.data.tasks[0].title.includes("Docker")) {
      throw new Error("Search by title failed");
    }
    console.log("✓ Search by title ILIKE 'Docker' passed (found:", searchJson.data.tasks[0].title, ")");

    // Sort by Due Date: asc
    const sortRes = await fetch(`${baseUrl}?sortBy=dueDate&sortOrder=asc`, {
      method: "GET",
      headers: headers1,
    });
    const sortJson = await sortRes.json();
    const dates = sortJson.data.tasks.map((t: any) => new Date(t.dueDate).getTime());
    if (dates[0] > dates[1]) {
      throw new Error("Sort by dueDate ascending failed");
    }
    console.log("✓ Sort by dueDate asc passed");

    // ----------------------------------------------------
    // Test 4: Get Single Task by ID (CRUD - Read)
    // ----------------------------------------------------
    console.log("\n--- Testing Get Task by ID (GET /tasks/:id) ---");
    const getByIdRes = await fetch(`${baseUrl}/${createdTask1.id}`, {
      method: "GET",
      headers: headers1,
    });
    const getByIdJson = await getByIdRes.json();
    if (getByIdRes.status !== 200 || getByIdJson.data.task.id !== createdTask1.id) {
      throw new Error("Get task by ID failed");
    }
    console.log("✓ Get task by ID passed");

    // ----------------------------------------------------
    // Test 5: Update Task (CRUD - Update PATCH)
    // ----------------------------------------------------
    console.log("\n--- Testing Update Task (PATCH /tasks/:id) ---");
    const updateRes = await fetch(`${baseUrl}/${createdTask1.id}`, {
      method: "PATCH",
      headers: headers1,
      body: JSON.stringify({
        title: "Complete Node.js Roadmap [UPDATED]",
        status: "completed",
      }),
    });
    const updateJson = await updateRes.json();
    if (
      updateRes.status !== 200 ||
      updateJson.data.task.title !== "Complete Node.js Roadmap [UPDATED]" ||
      updateJson.data.task.status !== "completed"
    ) {
      throw new Error("Update task failed");
    }
    console.log("✓ Update task (title & status) passed");

    // ----------------------------------------------------
    // Test 6: Delete Task (CRUD - Delete)
    // ----------------------------------------------------
    console.log("\n--- Testing Delete Task (DELETE /tasks/:id) ---");
    const deleteRes = await fetch(`${baseUrl}/${createdTask1.id}`, {
      method: "DELETE",
      headers: headers1,
    });
    const deleteJson = await deleteRes.json();
    if (deleteRes.status !== 200 || deleteJson.message !== "Task deleted successfully") {
      throw new Error("Delete task failed");
    }
    console.log("✓ Delete task passed");

    // Verify it returns 404 now
    const verifyDeleteRes = await fetch(`${baseUrl}/${createdTask1.id}`, {
      method: "GET",
      headers: headers1,
    });
    if (verifyDeleteRes.status !== 404) {
      throw new Error(`Expected 404 for deleted task, got ${verifyDeleteRes.status}`);
    }
    console.log("✓ Verification: fetching deleted task returns 404");

    // ----------------------------------------------------
    // Test 7: Validation & Error Handling (05.7)
    // ----------------------------------------------------
    console.log("\n--- Testing Validation & Error Handling ---");

    // Empty title validation
    const invalidTitleRes = await fetch(baseUrl, {
      method: "POST",
      headers: headers1,
      body: JSON.stringify({
        title: "",
      }),
    });
    const invalidTitleJson = await invalidTitleRes.json();
    if (invalidTitleRes.status !== 400 || !invalidTitleJson.errors) {
      throw new Error("Validation for empty title failed to return 400 with errors");
    }
    console.log("✓ Validation: Empty title returned 400 with error details:", invalidTitleJson.errors[0]?.message);

    // Invalid enum status
    const invalidStatusRes = await fetch(baseUrl, {
      method: "POST",
      headers: headers1,
      body: JSON.stringify({
        title: "Valid Title",
        status: "unknown_status",
      }),
    });
    if (invalidStatusRes.status !== 400) {
      throw new Error("Validation for invalid status failed");
    }
    console.log("✓ Validation: Invalid status returned 400");

    // Invalid UUID param
    const invalidParamRes = await fetch(`${baseUrl}/123-not-a-uuid`, {
      method: "GET",
      headers: headers1,
    });
    if (invalidParamRes.status !== 400) {
      throw new Error("Validation for invalid UUID param failed");
    }
    console.log("✓ Validation: Invalid UUID URL param returned 400");

    // ----------------------------------------------------
    // Test 8: User Isolation & Security
    // ----------------------------------------------------
    console.log("\n--- Testing User Isolation & Security ---");

    // User 2 tries to access User 1's remaining task (createdTask2)
    const unauthorizedAccessRes = await fetch(`${baseUrl}/${createdTask2.id}`, {
      method: "GET",
      headers: headers2,
    });
    if (unauthorizedAccessRes.status !== 404) {
      throw new Error(`Expected 404 when user 2 accesses user 1 task, got: ${unauthorizedAccessRes.status}`);
    }
    console.log("✓ User Isolation: User 2 cannot access User 1's task (returns 404)");

    // User 2 tasks list is empty
    const user2ListRes = await fetch(baseUrl, {
      method: "GET",
      headers: headers2,
    });
    const user2ListJson = await user2ListRes.json();
    if (user2ListJson.results !== 0) {
      throw new Error("User 2 list should be empty");
    }
    console.log("✓ User Isolation: User 2 tasks list is completely separated (0 tasks)");

    // Unauthenticated request
    const noAuthRes = await fetch(baseUrl, {
      method: "GET",
    });
    if (noAuthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got ${noAuthRes.status}`);
    }
    console.log("✓ Authentication: Request without token returned 401");

    // ----------------------------------------------------
    // Cleanup
    // ----------------------------------------------------
    console.log("\n--- Cleaning up test data ---");
    await pool.query(
      "DELETE FROM users WHERE email IN ('test_task_user1@example.com', 'test_task_user2@example.com')",
    );
    console.log("✓ Test users & cascading tasks cleaned up successfully");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉\n");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();
  }
};

runTests();
