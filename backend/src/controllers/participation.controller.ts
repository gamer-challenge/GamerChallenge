import { and, eq, sql } from "drizzle-orm"
import type { Context } from "hono"
import { db } from "../db/client"
import { challenges, participations, profiles } from "../db/schema"
import type { AuthVariables } from "../middlewares/auth.middleware"
import {
	checkAndAwardFirstParticipation,
	checkAndAwardTopLeaderboard,
} from "../services/badges.service"

export type ParticipationContext = Context<{ Variables: AuthVariables }>

const participationStatuses = [
	"pending",
	"validated",
	"rejected",
	"removed",
] as const

type ParticipationStatus = (typeof participationStatuses)[number]

function isParticipationStatus(value: unknown): value is ParticipationStatus {
	return (
		typeof value === "string" &&
		participationStatuses.includes(value as ParticipationStatus)
	)
}

function getParticipationId(c: Context) {
	const id = Number(c.req.param("id"))
	return Number.isInteger(id) && id > 0 ? id : undefined
}

export async function handleCreateParticipation(c: ParticipationContext) {
	const user = c.get("user")

	let body: {
		challengeId?: unknown
		videoUrl?: unknown
		screenshotUrl?: unknown
		description?: unknown
	}

	try {
		body = await c.req.json()
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	const challengeId = Number(body.challengeId)
	if (!Number.isInteger(challengeId) || challengeId <= 0) {
		return c.json({ error: "Invalid challengeId" }, 400)
	}

	const videoUrl =
		typeof body.videoUrl === "string" && body.videoUrl.trim()
			? body.videoUrl.trim()
			: null

	if (!videoUrl) {
		return c.json({ error: "videoUrl is required" }, 400)
	}

	const screenshotUrl =
		typeof body.screenshotUrl === "string" && body.screenshotUrl.trim()
			? body.screenshotUrl.trim()
			: null

	const description =
		typeof body.description === "string" && body.description.trim()
			? body.description.trim()
			: null

	const [challenge] = await db
		.select({ id: challenges.id })
		.from(challenges)
		.where(and(eq(challenges.id, challengeId), eq(challenges.status, "active")))
		.limit(1)

	if (!challenge) {
		return c.json({ error: "Challenge not found or not active" }, 404)
	}

	const [participation] = await db
		.insert(participations)
		.values({
			profileId: user.id,
			challengeId,
			videoUrl,
			screenshotUrl,
			description,
		})
		.returning()

	await checkAndAwardFirstParticipation(user.id)

	return c.json(participation, 201)
}

export async function handleGetParticipation(c: Context) {
	const id = getParticipationId(c)

	if (!id) {
		return c.json({ error: "Invalid participation id" }, 400)
	}

	const [participation] = await db
		.select()
		.from(participations)
		.where(eq(participations.id, id))
		.limit(1)

	if (!participation) {
		return c.json({ error: "Participation not found" }, 404)
	}

	return c.json(participation)
}

export async function handleUpdateParticipationStatus(c: ParticipationContext) {
	const id = getParticipationId(c)

	if (!id) {
		return c.json({ error: "Invalid participation id" }, 400)
	}

	let body: { status?: unknown }
	try {
		body = await c.req.json()
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	if (!isParticipationStatus(body.status)) {
		return c.json({ error: "Invalid status" }, 400)
	}

	const [existing] = await db
		.select({
			id: participations.id,
			profileId: participations.profileId,
			challengeId: participations.challengeId,
			status: participations.status,
		})
		.from(participations)
		.where(eq(participations.id, id))
		.limit(1)

	if (!existing) {
		return c.json({ error: "Participation not found" }, 404)
	}

	const [updated] = await db
		.update(participations)
		.set({ status: body.status, updatedAt: new Date() })
		.where(eq(participations.id, id))
		.returning()

	const [challenge] = await db
		.select({ rewardPoints: challenges.rewardPoints })
		.from(challenges)
		.where(eq(challenges.id, existing.challengeId))
		.limit(1)

	const rewardPoints = challenge?.rewardPoints ?? 0

	if (body.status === "validated" && existing.status !== "validated") {
		if (rewardPoints > 0) {
			await db
				.update(profiles)
				.set({
					points: sql`${profiles.points} + ${rewardPoints}`,
					updatedAt: new Date(),
				})
				.where(eq(profiles.id, existing.profileId))
		}

		await checkAndAwardTopLeaderboard(existing.profileId)
	} else if (body.status !== "validated" && existing.status === "validated") {
		if (rewardPoints > 0) {
			await db
				.update(profiles)
				.set({
					points: sql`greatest(0, ${profiles.points} - ${rewardPoints})`,
					updatedAt: new Date(),
				})
				.where(eq(profiles.id, existing.profileId))
		}
	}

	return c.json(updated)
}
