import { Hono } from "hono"
import {
	getChallengeLeaderboard,
	getLeaderboard,
} from "../controllers/leaderboard.controller"

const leaderboardRoutes = new Hono()

leaderboardRoutes.get("/", getLeaderboard)
leaderboardRoutes.get("/:challengeId", getChallengeLeaderboard)

export default leaderboardRoutes
