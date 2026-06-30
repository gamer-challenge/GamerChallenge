import { and, asc, desc, eq, type SQL, sql } from "drizzle-orm"
import type { Context } from "hono"
import { db } from "../db/client"
import {
	authUsers,
	badges,
	challenges,
	participations,
	profiles,
	reports,
	userBadges,
	votes,
} from "../db/schema"
import type { AuthVariables } from "../middlewares/auth.middleware"
import { checkAndAwardTopLeaderboard } from "../services/badges.service"

type AdminContext = Context<{ Variables: AuthVariables }>

const DEFAULT_ADMIN_LIMIT = 50
const MAX_ADMIN_LIMIT = 100

const participationStatuses = [
	"pending",
	"validated",
	"rejected",
	"removed",
] as const
const reportStatuses = ["open", "reviewing", "resolved", "rejected"] as const

type ParticipationStatus = (typeof participationStatuses)[number]
type ReportStatus = (typeof reportStatuses)[number]

function getPositiveIntegerParam(c: Context, name = "id") {
	const id = Number(c.req.param(name))

	return Number.isInteger(id) && id > 0 ? id : undefined
}

function getUserIdParam(c: Context) {
	const id = c.req.param("id")

	return typeof id === "string" && id.trim() ? id.trim() : undefined
}

function getPositiveQueryInteger(c: Context, name: string) {
	const value = Number(c.req.query(name))

	return Number.isInteger(value) && value > 0 ? value : undefined
}

function getAdminPagination(c: Context) {
	const requestedLimit = getPositiveQueryInteger(c, "limit")
	const limit = Math.min(requestedLimit ?? DEFAULT_ADMIN_LIMIT, MAX_ADMIN_LIMIT)
	const page = getPositiveQueryInteger(c, "page") ?? 1

	return {
		limit,
		offset: (page - 1) * limit,
	}
}

function isParticipationStatus(value: unknown): value is ParticipationStatus {
	return (
		typeof value === "string" &&
		participationStatuses.includes(value as ParticipationStatus)
	)
}

function isReportStatus(value: unknown): value is ReportStatus {
	return (
		typeof value === "string" && reportStatuses.includes(value as ReportStatus)
	)
}

function getOptionalTrimmedString(value: unknown) {
	if (value === undefined || value === null) {
		return undefined
	}

	return typeof value === "string" && value.trim() ? value.trim() : undefined
}

async function readJsonBody<T extends Record<string, unknown>>(c: Context) {
	try {
		return await c.req.json<T>()
	} catch {
		return undefined
	}
}

export async function handleAdminListUsers(c: Context) {
	const { limit, offset } = getAdminPagination(c)

	const users = await db
		.select({
			avatarUrl: profiles.avatarUrl,
			bio: profiles.bio,
			createdAt: profiles.createdAt,
			email: authUsers.email,
			id: profiles.id,
			isBanned: profiles.isBanned,
			karma: profiles.karma,
			lastSignInAt: authUsers.lastSignInAt,
			points: profiles.points,
			role: profiles.role,
			updatedAt: profiles.updatedAt,
			username: profiles.username,
		})
		.from(profiles)
		.innerJoin(authUsers, eq(profiles.id, authUsers.id))
		.orderBy(desc(profiles.createdAt), asc(profiles.username))
		.limit(limit)
		.offset(offset)

	return c.json(users)
}

export async function handleAdminBanUser(c: AdminContext) {
	const id = getUserIdParam(c)

	if (!id) {
		return c.json({ error: "Missing user id" }, 400)
	}

	let body: Record<string, unknown> = {}
	if (c.req.header("Content-Type")?.includes("application/json")) {
		body = (await readJsonBody(c)) ?? {}
	}

	const isBanned = body.isBanned === undefined ? true : body.isBanned

	if (typeof isBanned !== "boolean") {
		return c.json({ error: "isBanned must be a boolean" }, 400)
	}

	if (isBanned && c.get("user").id === id) {
		return c.json({ error: "Admins cannot ban their own account" }, 400)
	}

	const [updated] = await db
		.update(profiles)
		.set({ isBanned, updatedAt: new Date() })
		.where(eq(profiles.id, id))
		.returning()

	if (!updated) {
		return c.json({ error: "Profile not found" }, 404)
	}

	return c.json(updated)
}

export async function handleAdminUpdateUser(c: Context) {
	const id = getUserIdParam(c)

	if (!id) {
		return c.json({ error: "Missing user id" }, 400)
	}

	const body = await readJsonBody<{
		avatarUrl?: unknown
		bio?: unknown
		username?: unknown
	}>(c)

	if (!body) {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	const values: {
		avatarUrl?: string | null
		bio?: string | null
		updatedAt: Date
		username?: string
	} = { updatedAt: new Date() }

	if (body.username !== undefined) {
		const username = getOptionalTrimmedString(body.username)

		if (!username) {
			return c.json({ error: "username cannot be empty" }, 400)
		}

		values.username = username
	}

	if (body.avatarUrl !== undefined) {
		values.avatarUrl = getOptionalTrimmedString(body.avatarUrl) ?? null
	}

	if (body.bio !== undefined) {
		values.bio = getOptionalTrimmedString(body.bio) ?? null
	}

	const [updated] = await db
		.update(profiles)
		.set(values)
		.where(eq(profiles.id, id))
		.returning()

	if (!updated) {
		return c.json({ error: "Profile not found" }, 404)
	}

	return c.json(updated)
}

export async function handleAdminRemoveUserBadge(c: Context) {
	const profileId = getUserIdParam(c)
	const userBadgeId = getPositiveIntegerParam(c, "userBadgeId")

	if (!profileId) {
		return c.json({ error: "Missing user id" }, 400)
	}

	if (!userBadgeId) {
		return c.json({ error: "Invalid badge assignment id" }, 400)
	}

	const [deleted] = await db
		.delete(userBadges)
		.where(
			and(eq(userBadges.id, userBadgeId), eq(userBadges.profileId, profileId)),
		)
		.returning({ id: userBadges.id })

	if (!deleted) {
		return c.json({ error: "User badge not found" }, 404)
	}

	return c.body(null, 204)
}

export async function handleAdminDeleteChallenge(c: Context) {
	const id = getPositiveIntegerParam(c)

	if (!id) {
		return c.json({ error: "Invalid challenge id" }, 400)
	}

	const deleted = await db.transaction(async (tx) => {
		const [challenge] = await tx
			.select({
				id: challenges.id,
				rewardPoints: challenges.rewardPoints,
			})
			.from(challenges)
			.where(eq(challenges.id, id))
			.limit(1)
			.for("update")

		if (!challenge) {
			return undefined
		}

		if (challenge.rewardPoints > 0) {
			const validatedParticipations = await tx
				.select({ profileId: participations.profileId })
				.from(participations)
				.where(
					and(
						eq(participations.challengeId, id),
						eq(participations.status, "validated"),
					),
				)
				.for("update")

			const pointsByProfile = new Map<string, number>()

			for (const participation of validatedParticipations) {
				pointsByProfile.set(
					participation.profileId,
					(pointsByProfile.get(participation.profileId) ?? 0) +
						challenge.rewardPoints,
				)
			}

			for (const [profileId, pointsToDeduct] of pointsByProfile) {
				await tx
					.update(profiles)
					.set({
						points: sql`greatest(0, ${profiles.points} - ${pointsToDeduct})`,
						updatedAt: new Date(),
					})
					.where(eq(profiles.id, profileId))
			}
		}

		await tx.delete(challenges).where(eq(challenges.id, id))
		return { id: challenge.id }
	})

	if (!deleted) {
		return c.json({ error: "Challenge not found" }, 404)
	}

	return c.body(null, 204)
}

export async function handleAdminListParticipations(c: Context) {
	const { limit, offset } = getAdminPagination(c)
	const status = c.req.query("status")
	const userId = c.req.query("userId")

	if (status && !isParticipationStatus(status)) {
		return c.json({ error: "Invalid status" }, 400)
	}

	const filters: SQL[] = []

	if (status) {
		filters.push(eq(participations.status, status))
	}

	if (userId) {
		filters.push(eq(participations.profileId, userId))
	}

	const selection = db
		.select({
			challenge: {
				id: challenges.id,
				rewardPoints: challenges.rewardPoints,
				slug: challenges.slug,
				status: challenges.status,
				title: challenges.title,
			},
			createdAt: participations.createdAt,
			description: participations.description,
			downvotes: participations.downvotes,
			id: participations.id,
			player: {
				avatarUrl: profiles.avatarUrl,
				id: profiles.id,
				isBanned: profiles.isBanned,
				username: profiles.username,
			},
			screenshotUrl: participations.screenshotUrl,
			status: participations.status,
			updatedAt: participations.updatedAt,
			upvotes: participations.upvotes,
			videoUrl: participations.videoUrl,
		})
		.from(participations)
		.innerJoin(profiles, eq(participations.profileId, profiles.id))
		.innerJoin(challenges, eq(participations.challengeId, challenges.id))

	const rows =
		filters.length > 0
			? await selection
					.where(and(...filters))
					.orderBy(desc(participations.createdAt))
					.limit(limit)
					.offset(offset)
			: await selection
					.orderBy(desc(participations.createdAt))
					.limit(limit)
					.offset(offset)

	return c.json(rows)
}

export async function handleAdminModerateParticipation(c: AdminContext) {
	const id = getPositiveIntegerParam(c)

	if (!id) {
		return c.json({ error: "Invalid participation id" }, 400)
	}

	const body = await readJsonBody<{ status?: unknown }>(c)

	if (!body) {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	if (!isParticipationStatus(body.status)) {
		return c.json({ error: "Invalid status" }, 400)
	}
	const status = body.status

	let profileIdForLeaderboardCheck: string | undefined

	const updated = await db.transaction(async (tx) => {
		const [existing] = await tx
			.select({
				challengeId: participations.challengeId,
				id: participations.id,
				profileId: participations.profileId,
				rewardPoints: challenges.rewardPoints,
				status: participations.status,
			})
			.from(participations)
			.innerJoin(challenges, eq(participations.challengeId, challenges.id))
			.where(eq(participations.id, id))
			.limit(1)
			.for("update")

		if (!existing) {
			return undefined
		}

		const [row] = await tx
			.update(participations)
			.set({ status, updatedAt: new Date() })
			.where(eq(participations.id, id))
			.returning()

		if (status === "validated" && existing.status !== "validated") {
			if (existing.rewardPoints > 0) {
				await tx
					.update(profiles)
					.set({
						points: sql`${profiles.points} + ${existing.rewardPoints}`,
						updatedAt: new Date(),
					})
					.where(eq(profiles.id, existing.profileId))
			}
		} else if (status !== "validated" && existing.status === "validated") {
			if (existing.rewardPoints > 0) {
				await tx
					.update(profiles)
					.set({
						points: sql`greatest(0, ${profiles.points} - ${existing.rewardPoints})`,
						updatedAt: new Date(),
					})
					.where(eq(profiles.id, existing.profileId))
			}
		}

		if (status === "validated" && existing.status !== "validated") {
			profileIdForLeaderboardCheck = existing.profileId
		}

		return row
	})

	if (!updated) {
		return c.json({ error: "Participation not found" }, 404)
	}

	if (profileIdForLeaderboardCheck) {
		await checkAndAwardTopLeaderboard(profileIdForLeaderboardCheck)
	}

	return c.json(updated)
}

export async function handleAdminDeleteParticipation(c: Context) {
	const id = getPositiveIntegerParam(c)

	if (!id) {
		return c.json({ error: "Invalid participation id" }, 400)
	}

	const deleted = await db.transaction(async (tx) => {
		const [existing] = await tx
			.select({
				profileId: participations.profileId,
				rewardPoints: challenges.rewardPoints,
				status: participations.status,
			})
			.from(participations)
			.innerJoin(challenges, eq(participations.challengeId, challenges.id))
			.where(eq(participations.id, id))
			.limit(1)
			.for("update")

		if (!existing) {
			return undefined
		}

		if (existing.status === "validated" && existing.rewardPoints > 0) {
			await tx
				.update(profiles)
				.set({
					points: sql`greatest(0, ${profiles.points} - ${existing.rewardPoints})`,
					updatedAt: new Date(),
				})
				.where(eq(profiles.id, existing.profileId))
		}

		await tx.delete(participations).where(eq(participations.id, id))
		return { id }
	})

	if (!deleted) {
		return c.json({ error: "Participation not found" }, 404)
	}

	return c.body(null, 204)
}

export async function handleAdminListVotes(c: Context) {
	const { limit, offset } = getAdminPagination(c)

	const rows = await db
		.select({
			challenge: {
				id: challenges.id,
				slug: challenges.slug,
				title: challenges.title,
			},
			createdAt: votes.createdAt,
			id: votes.id,
			participation: {
				downvotes: participations.downvotes,
				id: participations.id,
				status: participations.status,
				upvotes: participations.upvotes,
			},
			value: votes.value,
			voter: {
				avatarUrl: profiles.avatarUrl,
				id: profiles.id,
				isBanned: profiles.isBanned,
				username: profiles.username,
			},
		})
		.from(votes)
		.innerJoin(profiles, eq(votes.profileId, profiles.id))
		.innerJoin(participations, eq(votes.participationId, participations.id))
		.innerJoin(challenges, eq(participations.challengeId, challenges.id))
		.orderBy(desc(votes.createdAt))
		.limit(limit)
		.offset(offset)

	return c.json(rows)
}

export async function handleAdminModerateVote(c: Context) {
	const id = getPositiveIntegerParam(c)

	if (!id) {
		return c.json({ error: "Invalid vote id" }, 400)
	}

	const body = await readJsonBody<{ value?: unknown }>(c)

	if (!body) {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	const value = Number(body.value)

	if (value !== 1 && value !== -1) {
		return c.json({ error: "Invalid value, must be 1 or -1" }, 400)
	}

	const updated = await db.transaction(async (tx) => {
		const [vote] = await tx
			.update(votes)
			.set({ value })
			.where(eq(votes.id, id))
			.returning()

		if (!vote) {
			return undefined
		}

		await tx
			.update(participations)
			.set({
				downvotes: sql`(select count(*) from ${votes} where ${votes.participationId} = ${vote.participationId} and ${votes.value} = -1)`,
				upvotes: sql`(select count(*) from ${votes} where ${votes.participationId} = ${vote.participationId} and ${votes.value} = 1)`,
			})
			.where(eq(participations.id, vote.participationId))

		return vote
	})

	if (!updated) {
		return c.json({ error: "Vote not found" }, 404)
	}

	return c.json(updated)
}

export async function handleAdminDeleteVote(c: Context) {
	const id = getPositiveIntegerParam(c)

	if (!id) {
		return c.json({ error: "Invalid vote id" }, 400)
	}

	const deleted = await db.transaction(async (tx) => {
		const [existing] = await tx
			.select({ participationId: votes.participationId })
			.from(votes)
			.where(eq(votes.id, id))
			.limit(1)
			.for("update")

		if (!existing) {
			return undefined
		}

		await tx.delete(votes).where(eq(votes.id, id))
		await tx
			.update(participations)
			.set({
				downvotes: sql`(select count(*) from ${votes} where ${votes.participationId} = ${existing.participationId} and ${votes.value} = -1)`,
				upvotes: sql`(select count(*) from ${votes} where ${votes.participationId} = ${existing.participationId} and ${votes.value} = 1)`,
			})
			.where(eq(participations.id, existing.participationId))

		return { id }
	})

	if (!deleted) {
		return c.json({ error: "Vote not found" }, 404)
	}

	return c.body(null, 204)
}

export async function handleAdminListReports(c: Context) {
	const { limit, offset } = getAdminPagination(c)
	const status = c.req.query("status")

	if (status && !isReportStatus(status)) {
		return c.json({ error: "Invalid status" }, 400)
	}

	const selection = db
		.select({
			createdAt: reports.createdAt,
			description: reports.description,
			id: reports.id,
			moderatorId: reports.moderatorId,
			moderatorNote: reports.moderatorNote,
			reason: reports.reason,
			reporter: {
				avatarUrl: profiles.avatarUrl,
				id: profiles.id,
				username: profiles.username,
			},
			resolvedAt: reports.resolvedAt,
			status: reports.status,
			targetId: reports.targetId,
			targetType: reports.targetType,
			updatedAt: reports.updatedAt,
		})
		.from(reports)
		.innerJoin(profiles, eq(reports.reporterId, profiles.id))

	const rows = status
		? await selection
				.where(eq(reports.status, status))
				.orderBy(desc(reports.createdAt))
				.limit(limit)
				.offset(offset)
		: await selection
				.orderBy(desc(reports.createdAt))
				.limit(limit)
				.offset(offset)

	return c.json(rows)
}

export async function handleAdminModerateReport(c: AdminContext) {
	const id = getPositiveIntegerParam(c)

	if (!id) {
		return c.json({ error: "Invalid report id" }, 400)
	}

	const body = await readJsonBody<{
		moderatorNote?: unknown
		status?: unknown
	}>(c)

	if (!body) {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	if (!isReportStatus(body.status)) {
		return c.json({ error: "Invalid status" }, 400)
	}

	const moderatorNote = getOptionalTrimmedString(body.moderatorNote)
	const isClosed = body.status === "resolved" || body.status === "rejected"
	const [updated] = await db
		.update(reports)
		.set({
			moderatorId: c.get("user").id,
			moderatorNote,
			resolvedAt: isClosed ? new Date() : null,
			status: body.status,
			updatedAt: new Date(),
		})
		.where(eq(reports.id, id))
		.returning()

	if (!updated) {
		return c.json({ error: "Report not found" }, 404)
	}

	return c.json(updated)
}

export async function handleAdminGetPlatformStats(c: Context) {
	const [
		[userStats],
		[challengeStats],
		[participationStats],
		[voteStats],
		[badgeStats],
		[reportStats],
	] = await Promise.all([
		db
			.select({
				admins: sql<number>`count(*) filter (where ${profiles.role} = 'admin')::int`,
				banned: sql<number>`count(*) filter (where ${profiles.isBanned} = true)::int`,
				total: sql<number>`count(*)::int`,
				totalKarma: sql<number>`coalesce(sum(${profiles.karma}), 0)::int`,
				totalPoints: sql<number>`coalesce(sum(${profiles.points}), 0)::int`,
			})
			.from(profiles),
		db
			.select({
				active: sql<number>`count(*) filter (where ${challenges.status} = 'active')::int`,
				closed: sql<number>`count(*) filter (where ${challenges.status} = 'closed')::int`,
				removed: sql<number>`count(*) filter (where ${challenges.status} = 'removed')::int`,
				total: sql<number>`count(*)::int`,
			})
			.from(challenges),
		db
			.select({
				pending: sql<number>`count(*) filter (where ${participations.status} = 'pending')::int`,
				rejected: sql<number>`count(*) filter (where ${participations.status} = 'rejected')::int`,
				removed: sql<number>`count(*) filter (where ${participations.status} = 'removed')::int`,
				total: sql<number>`count(*)::int`,
				validated: sql<number>`count(*) filter (where ${participations.status} = 'validated')::int`,
			})
			.from(participations),
		db
			.select({
				downvotes: sql<number>`count(*) filter (where ${votes.value} = -1)::int`,
				total: sql<number>`count(*)::int`,
				upvotes: sql<number>`count(*) filter (where ${votes.value} = 1)::int`,
			})
			.from(votes),
		db
			.select({
				awarded: sql<number>`(select count(*)::int from ${userBadges})`,
				total: sql<number>`count(*)::int`,
			})
			.from(badges),
		db
			.select({
				open: sql<number>`count(*) filter (where ${reports.status} = 'open')::int`,
				rejected: sql<number>`count(*) filter (where ${reports.status} = 'rejected')::int`,
				resolved: sql<number>`count(*) filter (where ${reports.status} = 'resolved')::int`,
				reviewing: sql<number>`count(*) filter (where ${reports.status} = 'reviewing')::int`,
				total: sql<number>`count(*)::int`,
			})
			.from(reports),
	])

	return c.json({
		badges: badgeStats,
		challenges: challengeStats,
		participations: participationStats,
		reports: reportStats,
		users: userStats,
		votes: voteStats,
	})
}
