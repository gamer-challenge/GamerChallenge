import { Hono } from "hono"
import {
	handleCreateBadge,
	handleDeleteBadge,
	handleListBadges,
} from "../controllers/badges.controller"
import { requireAuth } from "../middlewares/auth.middleware"
import { requireAdmin } from "../middlewares/require-admin"

const badgesRoutes = new Hono()

badgesRoutes.get("/", handleListBadges)
badgesRoutes.post("/", requireAuth, requireAdmin, handleCreateBadge)
badgesRoutes.delete("/:id", requireAuth, requireAdmin, handleDeleteBadge)

export default badgesRoutes
