import type { User } from "@supabase/supabase-js"
import { createMiddleware } from "hono/factory"
import { syncProfile } from "../auth/profile"
import { createSupabaseServerClient } from "../auth/supabase"

export type AuthVariables = {
	user: User
}

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
	async (c, next) => {
		const {
			data: { user },
			error,
		} = await createSupabaseServerClient(c).auth.getUser()

		if (error || !user) {
			return c.json({ error: "Unauthorized" }, 401)
		}

		const profile = await syncProfile(user)
		if (profile?.isBanned) {
			return c.json({ error: "Forbidden" }, 403)
		}

		c.set("user", user)

		await next()
	},
)
