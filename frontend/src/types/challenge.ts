export type ChallengeStatus = "active" | "closed" | "removed"

export type Challenge = {
	id: number
	title: string
	description: string
	rules: string
	rewardPoints: number
	status: ChallengeStatus
	slug: string
	createdAt: string
	updatedAt: string | null
	difficulty?: string | null
	youtubeUrl?: string | null
	game: {
		id: number
		name: string
		slug: string
		coverUrl: string | null
	}
	creator: {
		id: string
		username: string
		avatarUrl: string | null
	}
}

export type Submission = {
	id: number
	videoUrl: string
	description: string | null
	upvotes: number
	downvotes: number
	createdAt: string
	userVote: 1 | -1 | null
	player: {
		id: string
		username: string
		avatarUrl: string | null
	}
}
