import { eq } from "drizzle-orm"
import type { Context } from "hono"
import { db } from "../db/client"
import {
	badges,
	challenges,
	participations,
	profiles,
	userBadges,
} from "../db/schema"

export async function handleGetProfile(c: Context) {
	const id = c.req.param("id")

	if (!id) {
		return c.json({ error: "Missing user id" }, 400)
	}

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, id))
		.limit(1)

	if (!profile) {
		return c.json({ error: "Profile not found" }, 404)
	}

	return c.json(profile)
}

export async function handleEditProfile(c: Context) {
	const id = c.req.param("id")

	if (!id) {
		return c.json({ error: "Missing user id" }, 400)
	}

	const user = c.get("user")

	if (user.id !== id) {
		return c.json({ error: "Forbidden" }, 403)
	}

	const body = await c.req.json<{
		username?: string
		avatarUrl?: string
		bio?: string
	}>()

	const [updated] = await db
		.update(profiles)
		.set({ ...body, updatedAt: new Date() })
		.where(eq(profiles.id, id))
		.returning()

	return c.json(updated)
}

export async function handleDeleteProfile(c: Context) {
	const id = c.req.param("id")

	if (!id) {
		return c.json({ error: "Missing user id" }, 400)
	}

	const user = c.get("user")

	if (user.id !== id) {
		return c.json({ error: "Forbidden" }, 403)
	}

	await db.delete(profiles).where(eq(profiles.id, id))

	return c.body(null, 204)
}

export async function handleGetProfileChallenges(c: Context) {
	const id = c.req.param("id")

	if (!id) {
		return c.json({ error: "Missing user id" }, 400)
	}

	const profileChallenges = await db
		.select()
		.from(challenges)
		.where(eq(challenges.creatorId, id))

	return c.json(profileChallenges)
}

export async function handleGetProfileParticipations(c: Context) {
	const id = c.req.param("id")

	if (!id) {
		return c.json({ error: "Missing user id" }, 400)
	}

	const profileParticipations = await db
		.select()
		.from(participations)
		.where(eq(participations.profileId, id))

	return c.json(profileParticipations)
}

export async function handleGetProfileBadges(c: Context) {
	const id = c.req.param("id")

	if (!id) {
		return c.json({ error: "Missing user id" }, 400)
	}

	const profileBadges = await db
		.select({
			badges,
			userBadges,
		})
		.from(userBadges)
		.innerJoin(badges, eq(userBadges.badgeId, badges.id))
		.where(eq(userBadges.profileId, id))

	return c.json(profileBadges)
}
