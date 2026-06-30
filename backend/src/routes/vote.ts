import { Hono } from "hono"
import { handleVote } from "../controllers/vote.controller"
import { requireAuth } from "../middlewares/auth.middleware"

const voteRoutes = new Hono()

voteRoutes.post("/", requireAuth, handleVote)

export default voteRoutes
