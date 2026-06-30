import { Hono } from "hono"
import {
	handleAdminBanUser,
	handleAdminDeleteChallenge,
	handleAdminDeleteParticipation,
	handleAdminDeleteVote,
	handleAdminGetPlatformStats,
	handleAdminListParticipations,
	handleAdminListReports,
	handleAdminListUsers,
	handleAdminListVotes,
	handleAdminModerateParticipation,
	handleAdminModerateReport,
	handleAdminModerateVote,
	handleAdminRemoveUserBadge,
	handleAdminUpdateUser,
} from "../controllers/admin.controller"
import { handleAwardBadgeToUser } from "../controllers/badges.controller"
import { type AuthVariables, requireAuth } from "../middlewares/auth.middleware"
import { requireAdmin } from "../middlewares/require-admin"

const adminRoutes = new Hono<{ Variables: AuthVariables }>()

adminRoutes.use("/*", requireAuth, requireAdmin)

adminRoutes.get("/users", handleAdminListUsers)
adminRoutes.patch("/users/:id", handleAdminUpdateUser)
adminRoutes.patch("/users/:id/ban", handleAdminBanUser)
adminRoutes.post("/users/:id/badges", handleAwardBadgeToUser)
adminRoutes.delete("/users/:id/badges/:userBadgeId", handleAdminRemoveUserBadge)

adminRoutes.delete("/challenges/:id", handleAdminDeleteChallenge)

adminRoutes.get("/participations", handleAdminListParticipations)
adminRoutes.patch("/participations/:id", handleAdminModerateParticipation)
adminRoutes.delete("/participations/:id", handleAdminDeleteParticipation)

adminRoutes.get("/votes", handleAdminListVotes)
adminRoutes.patch("/votes/:id", handleAdminModerateVote)
adminRoutes.delete("/votes/:id", handleAdminDeleteVote)

adminRoutes.get("/reports", handleAdminListReports)
adminRoutes.patch("/reports/:id", handleAdminModerateReport)

adminRoutes.get("/stats", handleAdminGetPlatformStats)

export default adminRoutes
