import { Hono } from "hono"
import adminRoutes from "./admin"
import authRoutes from "./auth"
import badgesRoutes from "./badges"
import challengesRoutes from "./challenge"
import leaderboardRoutes from "./leaderboard"
import participationRoutes from "./participation"
import usersRoutes from "./users"
import voteRoutes from "./vote"

const v1Routes = new Hono()

v1Routes.route("/admin", adminRoutes)
v1Routes.route("/auth", authRoutes)
v1Routes.route("/badges", badgesRoutes)
v1Routes.route("/challenges", challengesRoutes)
v1Routes.route("/leaderboard", leaderboardRoutes)
v1Routes.route("/participations", participationRoutes)
v1Routes.route("/users", usersRoutes)
v1Routes.route("/vote", voteRoutes)

export default v1Routes
