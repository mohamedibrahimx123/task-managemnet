import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.js";
import { pool } from "../../config/database.js";

const router = Router();

/**
 * @openapi
 * /admin:
 *   get:
 *     summary: Admin-only dashboard endpoint
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Welcome message for admin
 */
router.get("/admin", authenticate, authorize("admin"), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin",
  });
});

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     summary: Get system metrics and counts across all users
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated system statistics
 */
router.get(
  "/admin/stats",
  authenticate,
  authorize("admin"),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const usersCountRes = await pool.query("SELECT COUNT(*) AS count FROM users");
      const tasksCountRes = await pool.query("SELECT COUNT(*) AS count FROM tasks");
      const statusRes = await pool.query(
        "SELECT status, COUNT(*) AS count FROM tasks GROUP BY status"
      );
      const priorityRes = await pool.query(
        "SELECT priority, COUNT(*) AS count FROM tasks GROUP BY priority"
      );

      const statusMap: Record<string, number> = {
        pending: 0,
        in_progress: 0,
        completed: 0,
      };
      statusRes.rows.forEach((r) => {
        statusMap[r.status] = parseInt(r.count, 10);
      });

      const priorityMap: Record<string, number> = {
        low: 0,
        medium: 0,
        high: 0,
      };
      priorityRes.rows.forEach((r) => {
        priorityMap[r.priority] = parseInt(r.count, 10);
      });

      res.status(200).json({
        success: true,
        data: {
          totalUsers: parseInt(usersCountRes.rows[0].count, 10),
          totalTasks: parseInt(tasksCountRes.rows[0].count, 10),
          tasksByStatus: statusMap,
          tasksByPriority: priorityMap,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: List all registered users with their task counts
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of all registered users
 */
router.get(
  "/admin/users",
  authenticate,
  authorize("admin"),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(`
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.role, 
          u.created_at AS "createdAt",
          COUNT(t.id)::int AS "taskCount"
        FROM users u
        LEFT JOIN tasks t ON u.id = t.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `);

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /admin/users/{id}/role:
 *   put:
 *     summary: Change user role (promote or demote)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: Role updated successfully
 */
router.put(
  "/admin/users/:id/role",
  authenticate,
  authorize("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (role !== "user" && role !== "admin") {
        return res.status(400).json({
          success: false,
          message: "Role must be either 'user' or 'admin'",
        });
      }

      const result = await pool.query(
        `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role`,
        [role, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: `User role updated to ${role}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
