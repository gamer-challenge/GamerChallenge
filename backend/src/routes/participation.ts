import { Hono } from "hono"
import {
	handleAdminListParticipations,
	handleAdminModerateParticipation,
} from "../controllers/admin.controller"
import {
	handleCreateParticipation,
	handleGetParticipation,
	handleUpdateParticipationStatus,
} from "../controllers/participation.controller"
import { requireAuth } from "../middlewares/auth.middleware"
import { requireAdmin } from "../middlewares/require-admin"

const participationRoutes = new Hono()

participationRoutes.post("/", requireAuth, handleCreateParticipation)
participationRoutes.get(
	"/",
	requireAuth,
	requireAdmin,
	handleAdminListParticipations,
)
participationRoutes.get("/:id", handleGetParticipation)
participationRoutes.patch(
	"/:id/status",
	requireAuth,
	requireAdmin,
	handleAdminModerateParticipation,
)
participationRoutes.patch(
	"/:id",
	requireAuth,
	requireAdmin,
	handleUpdateParticipationStatus,
)

export default participationRoutes
