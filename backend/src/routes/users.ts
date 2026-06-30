import { Hono } from "hono"
import { handleAwardBadgeToUser } from "../controllers/badges.controller"
import {
	handleDeleteProfile,
	handleEditProfile,
	handleGetProfile,
	handleGetProfileBadges,
	handleGetProfileChallenges,
	handleGetProfileParticipations,
} from "../controllers/users.controller"
import { requireAuth } from "../middlewares/auth.middleware"
import { requireAdmin } from "../middlewares/require-admin"

const usersRoutes = new Hono()

usersRoutes.get(":id", handleGetProfile)
usersRoutes.patch(":id", requireAuth, handleEditProfile)
usersRoutes.delete(":id", requireAuth, handleDeleteProfile)
usersRoutes.get(":id/challenges", handleGetProfileChallenges)
usersRoutes.get(":id/participations", handleGetProfileParticipations)
usersRoutes.get(":id/badges", handleGetProfileBadges)
usersRoutes.post(
	":id/badges",
	requireAuth,
	requireAdmin,
	handleAwardBadgeToUser,
)

export default usersRoutes
