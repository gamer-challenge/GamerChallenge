import { and, asc, desc, eq, isNull, sql } from "drizzle-orm"
import { db } from "../db/client"
import { badges, participations, profiles, userBadges } from "../db/schema"

export const BADGE_NAMES = {
	FIRST_PARTICIPATION: "Premier defi",
	TOP_LEADERBOARD: "Top du classement",
} as const

async function getBadgeIdByName(name: string): Promise<number | null> {
	const [badge] = await db
		.select({ id: badges.id })
		.from(badges)
		.where(eq(badges.name, name))
		.limit(1)

	return badge?.id ?? null
}

export async function awardBadge(
	profileId: string,
	badgeName: string,
	challengeId?: number,
) {
	const badgeId = await getBadgeIdByName(badgeName)

	if (!badgeId) return

	const condition =
		challengeId !== undefined
			? and(
					eq(userBadges.profileId, profileId),
					eq(userBadges.badgeId, badgeId),
					eq(userBadges.challengeId, challengeId),
				)
			: and(
					eq(userBadges.profileId, profileId),
					eq(userBadges.badgeId, badgeId),
					isNull(userBadges.challengeId),
				)

	const [existing] = await db
		.select({ id: userBadges.id })
		.from(userBadges)
		.where(condition)
		.limit(1)

	if (!existing) {
		await db
			.insert(userBadges)
			.values({ profileId, badgeId, challengeId: challengeId ?? null })
	}
}

export async function checkAndAwardFirstParticipation(profileId: string) {
	await db.transaction(async (tx) => {
		const [{ count }] = await tx
			.select({ count: sql<string>`count(*)` })
			.from(participations)
			.where(eq(participations.profileId, profileId))

		if (Number(count) === 1) {
			await awardBadge(profileId, BADGE_NAMES.FIRST_PARTICIPATION)
		}
	})
}

export async function checkAndAwardTopLeaderboard(profileId: string) {
	const [topPlayer] = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.isBanned, false))
		.orderBy(
			desc(profiles.points),
			desc(profiles.karma),
			asc(profiles.username),
		)
		.limit(1)

	if (topPlayer?.id === profileId) {
		await awardBadge(profileId, BADGE_NAMES.TOP_LEADERBOARD)
	}
}
