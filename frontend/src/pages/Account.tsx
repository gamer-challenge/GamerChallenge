import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { NavLink } from "react-router"
import Avatar from "../components/reusable/Avatar.tsx"
import BadgeCard from "../components/reusable/BadgeCard.tsx"
import Button from "../components/reusable/Button.tsx"
import GameCard from "../components/reusable/GameCard.tsx"
import Input from "../components/reusable/Input.tsx"
import { useAuth } from "../context/useAuth.ts"
import { api } from "../lib/api.ts"
import type { UserBadge } from "../types/badge.ts"
import type { Challenge } from "../types/challenge.ts"

type LeaderboardEntry = {
	id: string
	username: string
	points: number
	avatarUrl: string | null
}

export default function Account() {
	const { refreshUser, user } = useAuth()
	const [username, setUsername] = useState(() => user?.username ?? "")
	const [challenges, setChallenges] = useState<Challenge[]>([])
	const [challengesError, setChallengesError] = useState(false)
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
	const [userBadges, setUserBadges] = useState<UserBadge[]>([])
	const [isSavingUsername, setIsSavingUsername] = useState(false)
	const [usernameMessage, setUsernameMessage] = useState<string | null>(null)

	useEffect(() => {
		setUsername(user?.username ?? "")
	}, [user?.username])

	useEffect(() => {
		if (!user) return

		api
			.getChallenges()
			.then((res) => {
				if (!res.ok) throw new Error()
				return res.json()
			})
			.then((data: unknown) => {
				setChallengesError(false)
				if (Array.isArray(data)) setChallenges(data as Challenge[])
			})
			.catch(() => setChallengesError(true))
	}, [user])

	useEffect(() => {
		if (!user) return

		api
			.getLeaderboard({ limit: 100 })
			.then((res) => {
				if (!res.ok) throw new Error()
				return res.json()
			})
			.then((data: unknown) => {
				if (Array.isArray(data)) setLeaderboard(data as LeaderboardEntry[])
			})
			.catch(() => setLeaderboard([]))
	}, [user])

	useEffect(() => {
		if (!user?.id) {
			setUserBadges([])
			return
		}

		api
			.userBadges(user.id)
			.then((res) => (res.ok ? res.json() : []))
			.then((data: unknown) => {
				setUserBadges(
					Array.isArray(data)
						? data
								.map(normalizeUserBadge)
								.filter((badge): badge is UserBadge => badge !== null)
						: [],
				)
			})
			.catch(() => setUserBadges([]))
	}, [user?.id])

	const currentChallenges = useMemo(
		() =>
			[...challenges]
				.filter((challenge) => challenge.status === "active")
				.sort((left, right) => right.rewardPoints - left.rewardPoints)
				.slice(0, 3),
		[challenges],
	)

	const globalRank = useMemo(() => {
		if (!user) return null

		const index = leaderboard.findIndex((entry) => entry.id === user.id)
		return index >= 0 ? index + 1 : null
	}, [leaderboard, user])

	if (!user) {
		return (
			<div className="mx-auto flex min-h-[60svh] w-full max-w-container-max items-center justify-center px-md py-xl">
				<div className="glass-panel max-w-[32rem] rounded-xl p-xl text-center">
					<span className="material-symbols-outlined mb-md text-5xl text-primary">
						account_circle
					</span>
					<h1 className="font-h2 text-h2 text-on-surface">
						Authentication Required
					</h1>
					<p className="mt-sm text-on-surface-variant">
						Connect your gaming identity to access your profile dashboard.
					</p>
					<NavLink to="/sign-in" className="mt-lg inline-flex">
						<Button>Sign In</Button>
					</NavLink>
				</div>
			</div>
		)
	}

	const avatarSrc = user.avatarUrl || undefined
	const level = Math.max(1, Math.floor(user.points / 1000) + 1)
	const levelFloor = (level - 1) * 1000
	const nextLevelPoints = level * 1000
	const levelProgress = Math.min(
		100,
		Math.round(
			((user.points - levelFloor) / (nextLevelPoints - levelFloor)) * 100,
		),
	)
	const roleLabel = user.role === "admin" ? "Admin" : "Player"

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!user) return

		const formData = new FormData(event.currentTarget)
		const newUsername = String(formData.get("username") ?? "").trim()

		if (!newUsername) {
			setUsernameMessage("Le username ne peut pas etre vide.")
			return
		}

		setIsSavingUsername(true)
		setUsernameMessage(null)
		try {
			const response = await api.updateUserProfile(user.id, {
				username: newUsername,
			})
			if (!response.ok) throw new Error("Failed to update username")
			const updatedUser = await response.json()

			setUsername(updatedUser.username ?? newUsername)
			await refreshUser()
			setUsernameMessage("Username mis a jour.")
		} catch (error) {
			console.error("Error updating username:", error)
			setUsername(user.username)
			setUsernameMessage("Impossible de mettre a jour le username.")
		} finally {
			setIsSavingUsername(false)
		}
	}

	return (
		<div className="mx-auto flex w-full max-w-container-max flex-col gap-xl px-md py-xl md:px-xl">
			<section className="grid grid-cols-1 gap-lg lg:grid-cols-12">
				<div className="glass-panel-strong relative overflow-hidden rounded-xl p-lg md:p-xl lg:col-span-8">
					<div className="flex flex-col items-center gap-lg md:flex-row md:items-start">
						<div className="relative shrink-0">
							<Avatar src={avatarSrc} alt={user.username} size="xl" />
							<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-primary/50 bg-surface-container px-md py-xs font-caption text-caption uppercase tracking-[0.05em] text-primary shadow-[0_0_10px_rgba(124,58,237,0.4)]">
								Lvl {level}
							</div>
						</div>
						<div className="w-full min-w-0 text-center md:text-left">
							<div className="flex flex-col items-center gap-sm md:flex-row">
								<h1 className="font-h1 text-h1-mobile text-on-surface md:text-h1">
									{username}
								</h1>
								<span className="material-symbols-outlined text-3xl text-tertiary">
									verified
								</span>
							</div>
							<p className="mt-sm text-lead text-secondary">
								Track your points, karma, and live challenge opportunities.
							</p>
							<div className="mt-md flex flex-wrap justify-center gap-sm md:justify-start">
								<span className="inline-flex items-center gap-xs rounded-full border border-primary/30 bg-primary-container/20 px-md py-sm font-caption text-caption uppercase tracking-[0.05em] text-primary">
									<span className="material-symbols-outlined text-[16px]">
										trophy
									</span>
									{globalRank ? `Global Rank: #${globalRank}` : "Rank pending"}
								</span>
								<span className="inline-flex items-center gap-xs rounded-full border border-outline-variant/50 bg-surface-variant/50 px-md py-sm font-caption text-caption uppercase tracking-[0.05em] text-secondary">
									<span className="material-symbols-outlined text-[16px]">
										military_tech
									</span>
									{roleLabel}
								</span>
							</div>
							<form
								onSubmit={handleSubmit}
								className="mt-lg flex flex-col gap-sm md:max-w-[36rem] md:flex-row md:items-end"
							>
								<Input
									label="Username"
									type="text"
									name="username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
								/>
								<Button
									type="submit"
									className="md:w-auto"
									disabled={isSavingUsername}
								>
									{isSavingUsername ? "Saving..." : "Update"}
								</Button>
							</form>
							{usernameMessage && (
								<p className="mt-sm text-sm text-on-surface-variant">
									{usernameMessage}
								</p>
							)}
							<div className="mt-lg max-w-[36rem]">
								<div className="mb-xs flex justify-between text-sm text-on-surface-variant">
									<span>Total XP</span>
									<span>
										{user.points.toLocaleString()}{" "}
										<span className="text-secondary">
											/ {nextLevelPoints.toLocaleString()}
										</span>
									</span>
								</div>
								<div className="h-3 overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container-highest">
									<div
										className="h-full rounded-full bg-primary shadow-[0_0_15px_rgba(124,58,237,0.6)]"
										style={{ width: `${levelProgress}%` }}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-rows-2 gap-lg lg:col-span-4">
					<ProfileStat
						label="Total Points"
						value={user.points.toLocaleString()}
						icon="thumb_up"
						accent="text-tertiary"
					/>
					<ProfileStat
						label="Karma"
						value={user.karma.toLocaleString()}
						icon="bolt"
						accent="text-primary"
					/>
				</div>
			</section>

			<section>
				<div className="mb-lg flex items-center gap-sm border-b border-white/5 pb-sm">
					<span className="material-symbols-outlined text-primary">
						rocket_launch
					</span>
					<h2 className="font-h2 text-h2 text-on-surface">
						Current Challenges
					</h2>
				</div>
				{challengesError ? (
					<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
						Impossible de charger les challenges.
					</div>
				) : currentChallenges.length > 0 ? (
					<div className="grid grid-cols-1 gap-lg md:grid-cols-2 xl:grid-cols-3">
						{currentChallenges.map((challenge) => (
							<GameCard
								key={challenge.id}
								id={challenge.id}
								title={challenge.title}
								game={challenge.game.name}
								points={challenge.rewardPoints}
								difficulty={challenge.difficulty ?? undefined}
								imageUrl={challenge.game.coverUrl ?? undefined}
								description={challenge.description}
							/>
						))}
					</div>
				) : (
					<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
						Aucun challenge actif pour le moment.
					</div>
				)}
			</section>

			<section>
				<div className="mb-lg flex items-center gap-sm border-b border-white/5 pb-sm">
					<span className="material-symbols-outlined text-primary">
						military_tech
					</span>
					<h2 className="font-h2 text-h2 text-on-surface">Badges</h2>
				</div>
				{userBadges.length === 0 ? (
					<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
						Aucun badge pour le moment.
					</div>
				) : (
					<div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
						{userBadges.map((userBadge) => (
							<BadgeCard
								key={userBadge.userBadges.id}
								name={userBadge.badges.name}
								description={userBadge.badges.description}
								iconUrl={userBadge.badges.iconUrl}
								awardedAt={userBadge.userBadges.awardedAt}
							/>
						))}
					</div>
				)}
			</section>
		</div>
	)
}

function normalizeUserBadge(value: unknown): UserBadge | null {
	if (!isRecord(value)) return null

	const userBadge = value.userBadges ?? value.user_badges
	const badge = value.badges

	if (!isRecord(userBadge) || !isRecord(badge)) return null

	return {
		userBadges: userBadge as UserBadge["userBadges"],
		badges: badge as UserBadge["badges"],
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null
}

function ProfileStat({
	label,
	value,
	icon,
	accent,
}: {
	label: string
	value: string
	icon: string
	accent: string
}) {
	return (
		<div className="glass-panel flex items-center justify-between rounded-xl p-lg">
			<div>
				<p className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
					{label}
				</p>
				<p className={`mt-xs font-h2 text-h2 ${accent}`}>{value}</p>
			</div>
			<div className="flex h-12 w-12 items-center justify-center rounded-full border border-current/30 bg-surface-container">
				<span className={`material-symbols-outlined ${accent}`}>{icon}</span>
			</div>
		</div>
	)
}
