import { eq } from "drizzle-orm"
import { createMiddleware } from "hono/factory"
import { db } from "../db/client"
import { profiles } from "../db/schema"
import type { AuthVariables } from "./auth.middleware"

export const requireAdmin = createMiddleware<{ Variables: AuthVariables }>(
	async (c, next) => {
		const user = c.get("user")

		const [profile] = await db
			.select({ role: profiles.role })
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1)

		if (profile?.role !== "admin") {
			return c.json({ error: "Forbidden" }, 403)
		}

		await next()
	},
)
