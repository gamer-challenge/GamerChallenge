export type Badge = {
	id: number
	name: string
	description: string
	iconUrl: string | null
	createdAt: string
}

export type UserBadge = {
	userBadges: {
		id: number
		profileId: string
		badgeId: number
		challengeId: number | null
		awardedAt: string
	}
	badges: Badge
}
