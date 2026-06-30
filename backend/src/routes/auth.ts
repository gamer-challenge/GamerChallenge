import { Hono } from "hono"
import {
	handleGetMe,
	handleLogout,
	handleOAuthCallback,
	handleOAuthSignIn,
} from "../controllers/auth.controller"

const authRoutes = new Hono()

authRoutes.get("/me", handleGetMe)
authRoutes.get("/callback", handleOAuthCallback)
authRoutes.get("/sign-in", handleOAuthSignIn)
authRoutes.post("/logout", handleLogout)

export default authRoutes
