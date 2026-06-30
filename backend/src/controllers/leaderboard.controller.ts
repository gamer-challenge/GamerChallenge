import { and, asc, desc, eq, gte, sql } from "drizzle-orm"
import type { Context } from "hono"
import { db } from "../db/client"
import { challenges, games, participations, profiles } from "../db/schema"

const DEFAULT_LEADERBOARD_LIMIT = 50
const MAX_LEADERBOARD_LIMIT = 100

function getChallengeId(c: Context) {
	const id = Number(c.req.param("challengeId"))

	return Number.isInteger(id) && id > 0 ? id : undefined
}

function getPositiveQueryInteger(c: Context, name: string) {
	const value = Number(c.req.query(name))

	return Number.isInteger(value) && value > 0 ? value : undefined
}

function getLeaderboardPeriod(c: Context) {
	return c.req.query("period") === "month" ? "month" : "all"
}

function getLeaderboardPagination(c: Context) {
	const requestedLimit = getPositiveQueryInteger(c, "limit")
	const limit = Math.min(
		requestedLimit ?? DEFAULT_LEADERBOARD_LIMIT,
		MAX_LEADERBOARD_LIMIT,
	)
	const page = getPositiveQueryInteger(c, "page") ?? 1

	return {
		limit,
		offset: (page - 1) * limit,
	}
}

async function getLeaderboard(c: Context) {
	const { limit, offset } = getLeaderboardPagination(c)
	const period = getLeaderboardPeriod(c)
	const gameId = getPositiveQueryInteger(c, "gameId")

	try {
		if (period === "month" || gameId) {
			const startOfMonth = new Date()
			startOfMonth.setUTCDate(1)
			startOfMonth.setUTCHours(0, 0, 0, 0)

			const points = sql<number>`coalesce(sum(${challenges.rewardPoints}), 0)::int`
			const karma = sql<number>`coalesce(sum(${participations.upvotes} - ${participations.downvotes}), 0)::int`
			const filters = [
				eq(participations.status, "validated"),
				eq(profiles.isBanned, false),
			]

			if (period === "month") {
				filters.push(gte(participations.createdAt, startOfMonth))
			}

			if (gameId) {
				filters.push(eq(challenges.gameId, gameId))
			}

			const rows = await db
				.select({
					avatarUrl: profiles.avatarUrl,
					game: {
						id: games.id,
						name: games.name,
					},
					id: profiles.id,
					karma,
					points,
					username: profiles.username,
				})
				.from(participations)
				.innerJoin(profiles, eq(participations.profileId, profiles.id))
				.innerJoin(challenges, eq(participations.challengeId, challenges.id))
				.innerJoin(games, eq(challenges.gameId, games.id))
				.where(and(...filters))
				.groupBy(
					profiles.id,
					profiles.avatarUrl,
					profiles.username,
					games.id,
					games.name,
				)
				.orderBy(desc(points), desc(karma), asc(profiles.username))
				.limit(limit)
				.offset(offset)

			return c.json(rows)
		}

		const rows = await db
			.select({
				avatarUrl: profiles.avatarUrl,
				id: profiles.id,
				karma: profiles.karma,
				points: profiles.points,
				username: profiles.username,
			})
			.from(profiles)
			.where(eq(profiles.isBanned, false))
			.orderBy(
				desc(profiles.points),
				desc(profiles.karma),
				asc(profiles.username),
			)
			.limit(limit)
			.offset(offset)

		return c.json(rows)
	} catch (error) {
		console.error("Failed to fetch global leaderboard", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

async function getChallengeLeaderboard(c: Context) {
	const challengeId = getChallengeId(c)

	if (!challengeId) {
		return c.json({ error: "Invalid challenge id" }, 400)
	}

	try {
		const [challenge] = await db
			.select({ id: challenges.id })
			.from(challenges)
			.where(eq(challenges.id, challengeId))
			.limit(1)

		if (!challenge) {
			return c.json({ error: "Challenge not found" }, 404)
		}

		const { limit, offset } = getLeaderboardPagination(c)
		const score = sql<number>`${participations.upvotes} - ${participations.downvotes}`
		const rows = await db
			.select({
				createdAt: participations.createdAt,
				description: participations.description,
				downvotes: participations.downvotes,
				id: participations.id,
				player: {
					avatarUrl: profiles.avatarUrl,
					id: profiles.id,
					karma: profiles.karma,
					points: profiles.points,
					username: profiles.username,
				},
				score,
				screenshotUrl: participations.screenshotUrl,
				upvotes: participations.upvotes,
				videoUrl: participations.videoUrl,
			})
			.from(participations)
			.innerJoin(profiles, eq(participations.profileId, profiles.id))
			.where(
				and(
					eq(participations.challengeId, challengeId),
					eq(participations.status, "validated"),
					eq(profiles.isBanned, false),
				),
			)
			.orderBy(
				desc(score),
				desc(participations.upvotes),
				asc(profiles.username),
			)
			.limit(limit)
			.offset(offset)

		return c.json(rows)
	} catch (error) {
		console.error("Failed to fetch challenge leaderboard", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

export { getChallengeLeaderboard, getLeaderboard }
