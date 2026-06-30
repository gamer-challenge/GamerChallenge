import { Hono } from "hono"
import {
	createChallenge,
	deleteChallenge,
	getChallenge,
	getChallengeSubmissions,
	getChallenges,
	getCurrentSubscriptions,
	getMyParticipations,
	submitCompletionVideo,
	subscribeToChallenge,
	unsubscribeFromChallenge,
	updateChallenge,
} from "../controllers/challenge.controller"
import { type AuthVariables, requireAuth } from "../middlewares/auth.middleware"

const challengesRoutes = new Hono<{ Variables: AuthVariables }>()

challengesRoutes.get("/", getChallenges)

challengesRoutes.use("/me/*", requireAuth)
challengesRoutes.get("/me/subscriptions", getCurrentSubscriptions)
challengesRoutes.get("/me/participations", getMyParticipations)

challengesRoutes.get("/:id", getChallenge)

challengesRoutes.use("/*", requireAuth)
challengesRoutes.get("/:id/submissions", getChallengeSubmissions)

challengesRoutes.post("/", createChallenge)
challengesRoutes.post("/:id/subscribe", subscribeToChallenge)
challengesRoutes.delete("/:id/subscribe", unsubscribeFromChallenge)
challengesRoutes.post("/:id/submissions", submitCompletionVideo)
challengesRoutes.put("/:id", updateChallenge)
challengesRoutes.delete("/:id", deleteChallenge)

export default challengesRoutes
