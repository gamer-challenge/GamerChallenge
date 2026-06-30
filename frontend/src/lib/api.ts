const API_BASE = import.meta.env.VITE_API_URL ?? ""

type LeaderboardParams = {
	gameId?: number | string
	limit?: number
	page?: number
	period?: "all" | "month"
}

function getQuery(params: Record<string, string | number | undefined>) {
	const query = new URLSearchParams(
		Object.entries(params)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => [key, String(value)]),
	).toString()

	return query ? `?${query}` : ""
}

export const api = {
	getAuthUrl: (provider: "google" | "twitch", next?: string) =>
		`${API_BASE}/api/v1/auth/sign-in?provider=${provider}${next ? `&next=${next}` : ""}`,

	logout: () =>
		fetch(`${API_BASE}/api/v1/auth/logout`, {
			method: "POST",
			credentials: "include",
		}),

	me: () =>
		fetch(`${API_BASE}/api/v1/auth/me`, {
			credentials: "include",
		}),

	getUser: (userId: string) =>
		fetch(`${API_BASE}/api/v1/users/${userId}`, {
			credentials: "include",
		}),

	updateUserProfile: (
		userId: string,
		payload: {
			avatarUrl?: string | null
			bio?: string | null
			username?: string
		},
	) =>
		fetch(`${API_BASE}/api/v1/users/${userId}`, {
			method: "PATCH",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}),

	getUserChallenges: (userId: string) =>
		fetch(`${API_BASE}/api/v1/users/${userId}/challenges`, {
			credentials: "include",
		}),

	getLeaderboard: (params?: number | LeaderboardParams) => {
		const query =
			typeof params === "number"
				? getQuery({ limit: params })
				: getQuery({
						gameId: params?.gameId,
						limit: params?.limit,
						page: params?.page,
						period: params?.period,
					})

		return fetch(`${API_BASE}/api/v1/leaderboard${query}`, {
			credentials: "include",
		})
	},

	getBadges: () =>
		fetch(`${API_BASE}/api/v1/badges`, {
			credentials: "include",
		}),

	createBadge: (payload: {
		description: string
		iconUrl?: string | null
		name: string
	}) =>
		fetch(`${API_BASE}/api/v1/badges`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}),

	deleteBadge: (id: number | string) =>
		fetch(`${API_BASE}/api/v1/badges/${id}`, {
			method: "DELETE",
			credentials: "include",
		}),

	userBadges: (userId: string) =>
		fetch(`${API_BASE}/api/v1/users/${userId}/badges`, {
			credentials: "include",
		}),

	getChallengeLeaderboard: (
		challengeId: number | string,
		params?: { limit?: number; page?: number },
	) => {
		const query = getQuery(params ?? {})
		return fetch(`${API_BASE}/api/v1/leaderboard/${challengeId}${query}`, {
			credentials: "include",
		})
	},
	getChallenges: () =>
		fetch(`${API_BASE}/api/v1/challenges`, {
			credentials: "include",
		}),

	getChallenge: (id: number | string) =>
		fetch(`${API_BASE}/api/v1/challenges/${id}`, {
			credentials: "include",
		}),

	getChallengeSubmissions: (id: number | string) =>
		fetch(`${API_BASE}/api/v1/challenges/${id}/submissions`, {
			credentials: "include",
		}),

	subscribeToChallenge: (id: number | string) =>
		fetch(`${API_BASE}/api/v1/challenges/${id}/subscribe`, {
			method: "POST",
			credentials: "include",
		}),

	unsubscribeFromChallenge: (id: number | string) =>
		fetch(`${API_BASE}/api/v1/challenges/${id}/subscribe`, {
			method: "DELETE",
			credentials: "include",
		}),

	submitChallengeSubmission: (
		id: number | string,
		payload: {
			description?: string | null
			screenshotUrl?: string | null
			videoUrl: string
		},
	) =>
		fetch(`${API_BASE}/api/v1/challenges/${id}/submissions`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}),

	vote: (participationId: number, value: 1 | -1) =>
		fetch(`${API_BASE}/api/v1/vote`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ participationId, value }),
		}),

	getParticipations: (status?: string) => {
		const query = status ? `?status=${encodeURIComponent(status)}` : ""
		return fetch(`${API_BASE}/api/v1/participations${query}`, {
			credentials: "include",
		})
	},

	updateParticipationStatus: (
		id: number,
		status: "validated" | "rejected" | "removed",
	) =>
		fetch(`${API_BASE}/api/v1/participations/${id}/status`, {
			method: "PATCH",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status }),
		}),

	getAdminStats: () =>
		fetch(`${API_BASE}/api/v1/admin/stats`, {
			credentials: "include",
		}),

	getAdminUsers: (params?: { limit?: number; page?: number }) => {
		const query = getQuery(params ?? {})
		return fetch(`${API_BASE}/api/v1/admin/users${query}`, {
			credentials: "include",
		})
	},

	updateAdminUser: (
		userId: string,
		payload: {
			avatarUrl?: string | null
			bio?: string | null
			username?: string
		},
	) =>
		fetch(`${API_BASE}/api/v1/admin/users/${userId}`, {
			method: "PATCH",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}),

	updateAdminUserBan: (userId: string, isBanned: boolean) =>
		fetch(`${API_BASE}/api/v1/admin/users/${userId}/ban`, {
			method: "PATCH",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isBanned }),
		}),

	awardBadgeToUser: (
		userId: string,
		payload: {
			badgeName: string
			challengeId?: number
		},
	) =>
		fetch(`${API_BASE}/api/v1/admin/users/${userId}/badges`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}),

	deleteUserBadge: (userId: string, userBadgeId: number | string) =>
		fetch(`${API_BASE}/api/v1/admin/users/${userId}/badges/${userBadgeId}`, {
			method: "DELETE",
			credentials: "include",
		}),

	getAdminParticipations: (params?: {
		limit?: number
		page?: number
		status?: string
		userId?: string
	}) => {
		const query = getQuery(params ?? {})
		return fetch(`${API_BASE}/api/v1/admin/participations${query}`, {
			credentials: "include",
		})
	},

	deleteAdminParticipation: (id: number | string) =>
		fetch(`${API_BASE}/api/v1/admin/participations/${id}`, {
			method: "DELETE",
			credentials: "include",
		}),

	deleteAdminChallenge: (id: number | string) =>
		fetch(`${API_BASE}/api/v1/admin/challenges/${id}`, {
			method: "DELETE",
			credentials: "include",
		}),
}
