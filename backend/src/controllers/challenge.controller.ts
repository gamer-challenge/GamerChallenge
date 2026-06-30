import { and, desc, eq, ne } from "drizzle-orm"
import type { Context } from "hono"
import { db } from "../db/client"
import {
	challenges,
	games,
	participations,
	profiles,
	subscriptions,
	votes,
} from "../db/schema"
import type { AuthVariables } from "../middlewares/auth.middleware"

const challengeStatuses = ["active", "closed", "removed"] as const
const DEFAULT_USER_CHALLENGE_LIST_LIMIT = 50
const MAX_USER_CHALLENGE_LIST_LIMIT = 100
const challengeDifficulties = [
	"easy",
	"medium",
	"hard",
	"extreme",
	"insane",
] as const

type ChallengeContext = Context<{ Variables: AuthVariables }>
type ChallengeStatus = (typeof challengeStatuses)[number]
type ChallengeDifficulty = (typeof challengeDifficulties)[number]
type ChallengeBody = {
	description?: unknown
	difficulty?: unknown
	gameId?: unknown
	rewardPoints?: unknown
	rules?: unknown
	slug?: unknown
	status?: unknown
	title?: unknown
	youtubeUrl?: unknown
}
type CompletionSubmissionBody = {
	description?: unknown
	screenshotUrl?: unknown
	videoUrl?: unknown
}

function isChallengeStatus(value: unknown): value is ChallengeStatus {
	return (
		typeof value === "string" &&
		challengeStatuses.includes(value as ChallengeStatus)
	)
}

function isChallengeDifficulty(value: unknown): value is ChallengeDifficulty {
	return (
		typeof value === "string" &&
		challengeDifficulties.includes(value as ChallengeDifficulty)
	)
}

function getRequiredString(value: unknown) {
	return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function getOptionalString(value: unknown) {
	if (value === undefined) {
		return undefined
	}

	return getRequiredString(value)
}

function getOptionalNullableString(value: unknown) {
	if (value === undefined) {
		return undefined
	}

	if (value === null) {
		return null
	}

	return getRequiredString(value)
}

function getPositiveInteger(value: unknown) {
	if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
		return undefined
	}

	return value
}

function getNonNegativeInteger(value: unknown) {
	if (value === undefined) {
		return undefined
	}

	if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
		return undefined
	}

	return value
}

function getChallengeId(c: Context) {
	const id = Number(c.req.param("id"))

	return Number.isInteger(id) && id > 0 ? id : undefined
}

function getPositiveQueryInteger(c: Context, name: string) {
	const value = Number(c.req.query(name))

	return Number.isInteger(value) && value > 0 ? value : undefined
}

function getUserChallengeListPagination(c: Context) {
	const requestedLimit = getPositiveQueryInteger(c, "limit")
	const limit = Math.min(
		requestedLimit ?? DEFAULT_USER_CHALLENGE_LIST_LIMIT,
		MAX_USER_CHALLENGE_LIST_LIMIT,
	)
	const page = getPositiveQueryInteger(c, "page") ?? 1

	return {
		limit,
		offset: (page - 1) * limit,
	}
}

function getSlugFromTitle(title: string) {
	return title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 200)
}

async function readChallengeBody(c: Context) {
	try {
		return await c.req.json<ChallengeBody>()
	} catch {
		return undefined
	}
}

async function readCompletionSubmissionBody(c: Context) {
	try {
		return await c.req.json<CompletionSubmissionBody>()
	} catch {
		return undefined
	}
}

function isAllowedVideoUrl(value: string) {
	try {
		const url = new URL(value)
		const hostname = url.hostname.toLowerCase().replace(/^www\./, "")
		const allowedHosts = new Set([
			"youtube.com",
			"youtu.be",
			"twitch.tv",
			"clips.twitch.tv",
			"vimeo.com",
		])

		return (
			(url.protocol === "https:" || url.protocol === "http:") &&
			allowedHosts.has(hostname)
		)
	} catch {
		return false
	}
}

async function canManageChallenge(userId: string, creatorId: string) {
	if (userId === creatorId) {
		return true
	}

	const [profile] = await db
		.select({ role: profiles.role })
		.from(profiles)
		.where(eq(profiles.id, userId))
		.limit(1)

	return profile?.role === "admin"
}

function selectChallengeWithRelations() {
	return db
		.select({
			createdAt: challenges.createdAt,
			creator: {
				avatarUrl: profiles.avatarUrl,
				id: profiles.id,
				username: profiles.username,
			},
			description: challenges.description,
			difficulty: challenges.difficulty,
			game: {
				coverUrl: games.coverUrl,
				genre: games.genre,
				id: games.id,
				name: games.name,
				slug: games.slug,
			},
			id: challenges.id,
			rewardPoints: challenges.rewardPoints,
			rules: challenges.rules,
			slug: challenges.slug,
			status: challenges.status,
			title: challenges.title,
			updatedAt: challenges.updatedAt,
			youtubeUrl: challenges.youtubeUrl,
		})
		.from(challenges)
		.innerJoin(games, eq(challenges.gameId, games.id))
		.innerJoin(profiles, eq(challenges.creatorId, profiles.id))
}

async function getChallenges(c: Context) {
	const rows = await selectChallengeWithRelations()

	return c.json(rows)
}

async function getChallenge(c: Context) {
	const id = getChallengeId(c)

	if (!id) {
		return c.json({ error: "Invalid challenge id" }, 400)
	}

	const [challenge] = await selectChallengeWithRelations()
		.where(eq(challenges.id, id))
		.limit(1)

	if (!challenge) {
		return c.json({ error: "Challenge not found" }, 404)
	}

	return c.json(challenge)
}

async function subscribeToChallenge(c: ChallengeContext) {
	const id = getChallengeId(c)

	if (!id) {
		return c.json({ error: "Invalid challenge id" }, 400)
	}

	const user = c.get("user")
	try {
		const [challenge] = await db
			.select({ id: challenges.id, status: challenges.status })
			.from(challenges)
			.where(eq(challenges.id, id))
			.limit(1)

		if (!challenge) {
			return c.json({ error: "Challenge not found" }, 404)
		}

		if (challenge.status !== "active") {
			return c.json({ error: "Challenge is not active" }, 400)
		}

		const [existingSubscription] = await db
			.select({ id: subscriptions.id })
			.from(subscriptions)
			.where(
				and(
					eq(subscriptions.challengeId, id),
					eq(subscriptions.profileId, user.id),
				),
			)
			.limit(1)

		if (existingSubscription) {
			return c.json(existingSubscription)
		}

		const [subscription] = await db
			.insert(subscriptions)
			.values({ challengeId: id, profileId: user.id })
			.returning()

		return c.json(subscription, 201)
	} catch (error) {
		console.error("Failed to subscribe to challenge", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

//getChallengeSubmissions
async function getChallengeSubmissions(c: ChallengeContext) {
	const id = getChallengeId(c)

	if (!id) {
		return c.json({ error: "Invalid challenge id" }, 400)
	}

	try {
		const [challenge] = await db
			.select({ id: challenges.id })
			.from(challenges)
			.where(eq(challenges.id, id))
			.limit(1)

		if (!challenge) {
			return c.json({ error: "Challenge not found" }, 404)
		}

		const user = c.get("user")

		const rows = await db
			.select({
				id: participations.id,
				videoUrl: participations.videoUrl,
				description: participations.description,
				upvotes: participations.upvotes,
				downvotes: participations.downvotes,
				createdAt: participations.createdAt,
				userVote: votes.value,
				player: {
					id: profiles.id,
					username: profiles.username,
					avatarUrl: profiles.avatarUrl,
				},
			})
			.from(participations)
			.innerJoin(profiles, eq(participations.profileId, profiles.id))
			.leftJoin(
				votes,
				and(
					eq(votes.participationId, participations.id),
					eq(votes.profileId, user.id),
				),
			)
			.where(
				and(
					eq(participations.challengeId, id),
					ne(participations.status, "removed"),
				),
			)
			.orderBy(desc(participations.createdAt))

		return c.json(rows)
	} catch (error) {
		console.error("Failed to fetch challenge submissions", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

async function unsubscribeFromChallenge(c: ChallengeContext) {
	const id = getChallengeId(c)

	if (!id) {
		return c.json({ error: "Invalid challenge id" }, 400)
	}

	const user = c.get("user")
	try {
		const [challenge] = await db
			.select({ id: challenges.id })
			.from(challenges)
			.where(eq(challenges.id, id))
			.limit(1)

		if (!challenge) {
			return c.json({ error: "Challenge not found" }, 404)
		}

		const [subscription] = await db
			.delete(subscriptions)
			.where(
				and(
					eq(subscriptions.challengeId, id),
					eq(subscriptions.profileId, user.id),
				),
			)
			.returning()

		if (!subscription) {
			return c.json({ error: "Subscription not found" }, 404)
		}

		return c.body(null, 204)
	} catch (error) {
		console.error("Failed to unsubscribe from challenge", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

async function submitCompletionVideo(c: ChallengeContext) {
	const id = getChallengeId(c)

	if (!id) {
		return c.json({ error: "Invalid challenge id" }, 400)
	}

	const user = c.get("user")
	const body = await readCompletionSubmissionBody(c)

	if (!body) {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	const videoUrl = getRequiredString(body.videoUrl)
	const screenshotUrl = getOptionalNullableString(body.screenshotUrl)
	const description = getOptionalNullableString(body.description)

	if (!videoUrl || !isAllowedVideoUrl(videoUrl)) {
		return c.json({ error: "Invalid video URL" }, 400)
	}

	try {
		const [challenge] = await db
			.select({ id: challenges.id, status: challenges.status })
			.from(challenges)
			.where(eq(challenges.id, id))
			.limit(1)

		if (!challenge) {
			return c.json({ error: "Challenge not found" }, 404)
		}

		if (challenge.status !== "active") {
			return c.json({ error: "Challenge is not active" }, 400)
		}

		const [subscription] = await db
			.select({ id: subscriptions.id })
			.from(subscriptions)
			.where(
				and(
					eq(subscriptions.challengeId, id),
					eq(subscriptions.profileId, user.id),
				),
			)
			.limit(1)

		if (!subscription) {
			return c.json(
				{ error: "Subscribe to the challenge before submitting" },
				400,
			)
		}

		const [participation] = await db
			.insert(participations)
			.values({
				challengeId: id,
				description,
				profileId: user.id,
				screenshotUrl,
				videoUrl,
			})
			.returning()

		return c.json(participation, 201)
	} catch (error) {
		console.error("Failed to submit challenge completion", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

async function getCurrentSubscriptions(c: ChallengeContext) {
	const user = c.get("user")
	const { limit, offset } = getUserChallengeListPagination(c)

	try {
		const rows = await db
			.select({
				challenge: {
					createdAt: challenges.createdAt,
					description: challenges.description,
					id: challenges.id,
					rewardPoints: challenges.rewardPoints,
					rules: challenges.rules,
					slug: challenges.slug,
					status: challenges.status,
					title: challenges.title,
					updatedAt: challenges.updatedAt,
				},
				game: {
					coverUrl: games.coverUrl,
					id: games.id,
					name: games.name,
					slug: games.slug,
				},
				subscribedAt: subscriptions.createdAt,
				subscriptionId: subscriptions.id,
			})
			.from(subscriptions)
			.innerJoin(challenges, eq(subscriptions.challengeId, challenges.id))
			.innerJoin(games, eq(challenges.gameId, games.id))
			.where(
				and(
					eq(subscriptions.profileId, user.id),
					eq(challenges.status, "active"),
				),
			)
			.orderBy(desc(subscriptions.createdAt))
			.limit(limit)
			.offset(offset)

		return c.json(rows)
	} catch (error) {
		console.error("Failed to fetch current subscriptions", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

async function getMyParticipations(c: ChallengeContext) {
	const user = c.get("user")
	const { limit, offset } = getUserChallengeListPagination(c)

	try {
		const rows = await db
			.select({
				challenge: {
					createdAt: challenges.createdAt,
					description: challenges.description,
					id: challenges.id,
					rewardPoints: challenges.rewardPoints,
					rules: challenges.rules,
					slug: challenges.slug,
					status: challenges.status,
					title: challenges.title,
					updatedAt: challenges.updatedAt,
				},
				game: {
					coverUrl: games.coverUrl,
					id: games.id,
					name: games.name,
					slug: games.slug,
				},
				participation: {
					createdAt: participations.createdAt,
					description: participations.description,
					downvotes: participations.downvotes,
					id: participations.id,
					screenshotUrl: participations.screenshotUrl,
					status: participations.status,
					upvotes: participations.upvotes,
					videoUrl: participations.videoUrl,
				},
			})
			.from(participations)
			.innerJoin(challenges, eq(participations.challengeId, challenges.id))
			.innerJoin(games, eq(challenges.gameId, games.id))
			.where(
				and(
					eq(participations.profileId, user.id),
					ne(participations.status, "removed"),
				),
			)
			.orderBy(desc(participations.createdAt))
			.limit(limit)
			.offset(offset)

		return c.json(rows)
	} catch (error) {
		console.error("Failed to fetch participations", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

async function createChallenge(c: ChallengeContext) {
	const user = c.get("user")
	const body = await readChallengeBody(c)

	if (!body) {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	const title = getRequiredString(body.title)
	const description = getRequiredString(body.description)
	const rules = getRequiredString(body.rules)
	const gameId = getPositiveInteger(body.gameId)
	const rewardPoints = getNonNegativeInteger(body.rewardPoints) ?? 0
	const status = body.status === undefined ? "active" : body.status
	const difficulty =
		body.difficulty === undefined
			? undefined
			: isChallengeDifficulty(body.difficulty)
				? body.difficulty
				: null

	if (
		!title ||
		!description ||
		!rules ||
		!gameId ||
		!isChallengeStatus(status) ||
		difficulty === null
	) {
		return c.json({ error: "Invalid challenge payload" }, 400)
	}

	const [game] = await db
		.select({ id: games.id })
		.from(games)
		.where(eq(games.id, gameId))
		.limit(1)

	if (!game) {
		return c.json({ error: "Game not found" }, 404)
	}

	const slug = getOptionalString(body.slug) ?? getSlugFromTitle(title)
	const youtubeUrl = getOptionalString(body.youtubeUrl)
	const [challenge] = await db
		.insert(challenges)
		.values({
			creatorId: user.id,
			description,
			difficulty,
			gameId,
			rewardPoints,
			rules,
			slug,
			status,
			title,
			youtubeUrl,
		})
		.returning()

	return c.json(challenge, 201)
}

async function updateChallenge(c: ChallengeContext) {
	const id = getChallengeId(c)

	if (!id) {
		return c.json({ error: "Invalid challenge id" }, 400)
	}

	const user = c.get("user")
	const body = await readChallengeBody(c)

	if (!body) {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	const [existingChallenge] = await db
		.select({ creatorId: challenges.creatorId })
		.from(challenges)
		.where(eq(challenges.id, id))
		.limit(1)

	if (!existingChallenge) {
		return c.json({ error: "Challenge not found" }, 404)
	}

	if (!(await canManageChallenge(user.id, existingChallenge.creatorId))) {
		return c.json({ error: "Forbidden" }, 403)
	}

	const values: Partial<typeof challenges.$inferInsert> = {
		updatedAt: new Date(),
	}
	const title = getOptionalString(body.title)
	const description = getOptionalString(body.description)
	const rules = getOptionalString(body.rules)
	const slug = getOptionalString(body.slug)
	const youtubeUrl = getOptionalString(body.youtubeUrl)
	const rewardPoints = getNonNegativeInteger(body.rewardPoints)
	const gameId =
		body.gameId === undefined ? undefined : getPositiveInteger(body.gameId)

	if (title) {
		values.title = title
	}

	if (description) {
		values.description = description
	}

	if (rules) {
		values.rules = rules
	}

	if (slug) {
		values.slug = slug
	}

	if (youtubeUrl !== undefined) {
		values.youtubeUrl = youtubeUrl
	}

	if (rewardPoints !== undefined) {
		values.rewardPoints = rewardPoints
	}

	if (gameId !== undefined) {
		values.gameId = gameId
	}

	if (body.status !== undefined) {
		if (!isChallengeStatus(body.status)) {
			return c.json({ error: "Invalid challenge payload" }, 400)
		}

		values.status = body.status
	}

	if (body.difficulty !== undefined) {
		if (!isChallengeDifficulty(body.difficulty)) {
			return c.json({ error: "Invalid challenge payload" }, 400)
		}

		values.difficulty = body.difficulty
	}

	if (Object.keys(values).length === 1) {
		return c.json({ error: "No valid challenge fields to update" }, 400)
	}

	const [challenge] = await db
		.update(challenges)
		.set(values)
		.where(eq(challenges.id, id))
		.returning()

	return c.json(challenge)
}

async function deleteChallenge(c: ChallengeContext) {
	const id = getChallengeId(c)

	if (!id) {
		return c.json({ error: "Invalid challenge id" }, 400)
	}

	const user = c.get("user")
	const [existingChallenge] = await db
		.select({ creatorId: challenges.creatorId })
		.from(challenges)
		.where(eq(challenges.id, id))
		.limit(1)

	if (!existingChallenge) {
		return c.json({ error: "Challenge not found" }, 404)
	}

	if (!(await canManageChallenge(user.id, existingChallenge.creatorId))) {
		return c.json({ error: "Forbidden" }, 403)
	}

	await db.delete(challenges).where(eq(challenges.id, id))

	return c.body(null, 204)
}

export {
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
}
