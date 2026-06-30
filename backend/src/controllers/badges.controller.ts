import { eq } from "drizzle-orm"
import type { Context } from "hono"
import { db } from "../db/client"
import { badges, profiles } from "../db/schema"
import type { AuthVariables } from "../middlewares/auth.middleware"
import { awardBadge } from "../services/badges.service"

type AdminContext = Context<{ Variables: AuthVariables }>

export async function handleListBadges(c: Context) {
	const allBadges = await db.select().from(badges)
	return c.json(allBadges)
}

export async function handleCreateBadge(c: AdminContext) {
	let body: { name?: unknown; description?: unknown; iconUrl?: unknown }
	try {
		body = await c.req.json()
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	const name =
		typeof body.name === "string" && body.name.trim() ? body.name.trim() : null

	const description =
		typeof body.description === "string" && body.description.trim()
			? body.description.trim()
			: null

	if (!name || !description) {
		return c.json({ error: "name and description are required" }, 400)
	}

	const iconUrl =
		typeof body.iconUrl === "string" && body.iconUrl.trim()
			? body.iconUrl.trim()
			: null

	const [badge] = await db
		.insert(badges)
		.values({ name, description, iconUrl })
		.returning()

	return c.json(badge, 201)
}

export async function handleDeleteBadge(c: AdminContext) {
	const id = Number(c.req.param("id"))

	if (!Number.isInteger(id) || id <= 0) {
		return c.json({ error: "Invalid badge id" }, 400)
	}

	const [deleted] = await db
		.delete(badges)
		.where(eq(badges.id, id))
		.returning({ id: badges.id })

	if (!deleted) {
		return c.json({ error: "Badge not found" }, 404)
	}

	return c.body(null, 204)
}

export async function handleAwardBadgeToUser(c: AdminContext) {
	const profileId = c.req.param("id")

	if (!profileId) {
		return c.json({ error: "Missing user id" }, 400)
	}

	let body: { badgeName?: unknown; challengeId?: unknown }
	try {
		body = await c.req.json()
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	const badgeName =
		typeof body.badgeName === "string" && body.badgeName.trim()
			? body.badgeName.trim()
			: null

	if (!badgeName) {
		return c.json({ error: "badgeName is required" }, 400)
	}

	const challengeId =
		body.challengeId !== undefined ? Number(body.challengeId) : undefined

	if (
		challengeId !== undefined &&
		(!Number.isInteger(challengeId) || challengeId <= 0)
	) {
		return c.json({ error: "Invalid challengeId" }, 400)
	}

	const [targetProfile] = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.limit(1)

	if (!targetProfile) {
		return c.json({ error: "Profile not found" }, 404)
	}

	await awardBadge(profileId, badgeName, challengeId)

	return c.json({ message: "Badge awarded" })
}
