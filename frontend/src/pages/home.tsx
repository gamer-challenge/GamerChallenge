import { useEffect, useMemo, useState } from "react"
import { NavLink } from "react-router"
import { Button, GameCard, Leaderboard } from "../components/reusable"
import { useAuth } from "../context/useAuth"
import { api } from "../lib/api"
import type { Challenge } from "../types/challenge"

type LeaderboardEntry = {
	id: string
	username: string
	points: number
	avatarUrl: string | null
}

type GameSummary = {
	id: number
	name: string
	coverUrl?: string
	challengeCount: number
	topReward: number
}

const difficultyRank: Record<string, number> = {
	easy: 1,
	medium: 2,
	hard: 3,
	extreme: 4,
	insane: 5,
}
const preferredHeroChallengeSlug = "valorant-one-tap-clutch"

const formatCompactNumber = (value: number) =>
	new Intl.NumberFormat("en", {
		compactDisplay: "short",
		maximumFractionDigits: value >= 1000 ? 1 : 0,
		notation: "compact",
	}).format(value)

export default function HomePage() {
	const { user } = useAuth()
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
	const [leaderboardError, setLeaderboardError] = useState(false)
	const [challenges, setChallenges] = useState<Challenge[]>([])
	const [challengesError, setChallengesError] = useState(false)
	const [challengesLoading, setChallengesLoading] = useState(true)

	useEffect(() => {
		api
			.getLeaderboard(5)
			.then((res) => {
				if (!res.ok) throw new Error()
				return res.json()
			})
			.then((data: unknown) => {
				if (Array.isArray(data)) setLeaderboard(data)
			})
			.catch(() => setLeaderboardError(true))
	}, [])

	useEffect(() => {
		api
			.getChallenges()
			.then((res) => {
				if (!res.ok) throw new Error()
				return res.json()
			})
			.then((data: unknown) => {
				if (Array.isArray(data)) setChallenges(data as Challenge[])
			})
			.catch(() => setChallengesError(true))
			.finally(() => setChallengesLoading(false))
	}, [])

	const activeChallenges = useMemo(
		() => challenges.filter((challenge) => challenge.status === "active"),
		[challenges],
	)

	const featuredChallenges = useMemo(
		() =>
			[...activeChallenges]
				.sort((left, right) => {
					const rewardDelta = right.rewardPoints - left.rewardPoints
					if (rewardDelta !== 0) return rewardDelta

					return (
						(difficultyRank[right.difficulty ?? ""] ?? 0) -
						(difficultyRank[left.difficulty ?? ""] ?? 0)
					)
				})
				.slice(0, 3),
		[activeChallenges],
	)

	const gameSummaries = useMemo(() => {
		const summaries = new Map<number, GameSummary>()

		for (const challenge of activeChallenges) {
			const existing = summaries.get(challenge.game.id)
			if (existing) {
				existing.challengeCount += 1
				existing.topReward = Math.max(
					existing.topReward,
					challenge.rewardPoints,
				)
				existing.coverUrl =
					existing.coverUrl ?? challenge.game.coverUrl ?? undefined
				continue
			}

			summaries.set(challenge.game.id, {
				id: challenge.game.id,
				name: challenge.game.name,
				coverUrl: challenge.game.coverUrl ?? undefined,
				challengeCount: 1,
				topReward: challenge.rewardPoints,
			})
		}

		return [...summaries.values()]
			.sort(
				(left, right) =>
					right.challengeCount - left.challengeCount ||
					right.topReward - left.topReward,
			)
			.slice(0, 3)
	}, [activeChallenges])

	const heroChallenge =
		challenges.find(
			(challenge) => challenge.slug === preferredHeroChallengeSlug,
		) ??
		featuredChallenges[0] ??
		activeChallenges[0] ??
		challenges[0] ??
		null
	const heroImage = heroChallenge?.game.coverUrl ?? undefined
	const gameCount = new Set(
		activeChallenges.map((challenge) => challenge.game.id),
	).size
	const topReward = activeChallenges.reduce(
		(max, challenge) => Math.max(max, challenge.rewardPoints),
		0,
	)
	const topHunter = leaderboard[0]
	const stats = [
		{
			label: "Active missions",
			value: formatCompactNumber(activeChallenges.length),
		},
		{
			label: "Games covered",
			value: formatCompactNumber(gameCount),
		},
		{
			label: "Top bounty",
			value: topReward > 0 ? `${formatCompactNumber(topReward)} XP` : "0 XP",
		},
	]

	return (
		<div className="flex flex-col">
			<section className="relative min-h-[calc(100svh-72px)] overflow-hidden">
				<div className="absolute inset-0">
					{heroImage ? (
						<img
							src={heroImage}
							alt={heroChallenge?.game.name ?? "Competitive gaming arena"}
							className="h-full w-full object-cover opacity-35"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-surface-container-lowest">
							<span className="material-symbols-outlined text-[12rem] text-primary/20">
								sports_esports
							</span>
						</div>
					)}
					<div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-background/72 to-background" />
					<div className="kinetic-grid" />
				</div>

				<div className="relative z-10 mx-auto flex min-h-[calc(100svh-72px)] max-w-container-max flex-col justify-center px-md py-20 md:px-xl">
					<div className="max-w-[56rem] text-center md:text-left">
						<p className="mb-md font-caption text-caption uppercase tracking-[0.05em] text-tertiary">
							Competitive proof platform
						</p>
						<h1 className="font-h1 text-h1-mobile text-on-surface md:text-[64px] md:leading-tight">
							Level Up Your <span className="gradient-text">Gaming</span>
						</h1>
						<p className="mt-lg max-w-[42rem] text-lead text-on-surface-variant">
							Take on live challenges, prove your skills with verified evidence,
							and climb the global rankings.
						</p>
						<div className="mt-xl flex flex-col gap-md sm:flex-row sm:justify-center md:justify-start">
							<NavLink to={user ? "/challenges" : "/sign-up"}>
								<Button size="lg" className="w-full sm:w-auto">
									<span className="material-symbols-outlined">
										rocket_launch
									</span>
									{user ? "Browse Challenges" : "Join the Hub"}
								</Button>
							</NavLink>
							<NavLink to="/challenges">
								<Button
									variant="secondary"
									size="lg"
									className="w-full sm:w-auto"
								>
									Explore Challenges
								</Button>
							</NavLink>
						</div>
					</div>

					<div className="mt-16 grid max-w-[56rem] grid-cols-1 gap-md sm:grid-cols-3">
						{stats.map((stat) => (
							<div
								key={stat.label}
								className="glass-panel rounded-xl p-md text-center md:text-left"
							>
								<p className="font-h2 text-[30px] text-primary">{stat.value}</p>
								<p className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
									{stat.label}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="mx-auto w-full max-w-container-max px-md py-20 md:px-xl">
				<div className="mb-xl flex flex-col justify-between gap-md md:flex-row md:items-end">
					<div>
						<h2 className="font-h2 text-h2 text-on-surface">
							Featured Challenges
						</h2>
						<p className="mt-sm text-on-surface-variant">
							Highest reward bounties from the live mission board.
						</p>
					</div>
					<NavLink
						to="/challenges"
						className="hidden items-center gap-sm font-semibold text-primary transition-colors hover:text-tertiary md:flex"
					>
						View all
						<span className="material-symbols-outlined text-[18px]">
							arrow_forward
						</span>
					</NavLink>
				</div>
				{challengesError ? (
					<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
						Impossible de charger les challenges.
					</div>
				) : challengesLoading ? (
					<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
						Chargement des challenges...
					</div>
				) : featuredChallenges.length > 0 ? (
					<div className="grid grid-cols-1 gap-lg md:grid-cols-2 lg:grid-cols-3">
						{featuredChallenges.map((challenge) => (
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

			<section className="border-y border-white/5 bg-surface-container-low/50 py-20">
				<div className="mx-auto max-w-container-max px-md md:px-xl">
					<div className="mb-xl text-center">
						<h2 className="font-h2 text-h2 text-on-surface">Mission Pulse</h2>
						<p className="mt-sm text-on-surface-variant">
							Current games and rewards are pulled from the challenge board.
						</p>
					</div>
					<div className="grid grid-cols-1 gap-md md:grid-cols-4 md:auto-rows-[220px]">
						{gameSummaries.length > 0 ? (
							gameSummaries.map((summary, index) => (
								<NavLink
									key={summary.id}
									to="/challenges"
									className={`glass-panel neon-glow group relative flex flex-col justify-end overflow-hidden rounded-xl p-lg ${
										index === 0 ? "md:col-span-2" : ""
									}`}
								>
									{summary.coverUrl && (
										<img
											src={summary.coverUrl}
											alt={summary.name}
											className="absolute inset-0 h-full w-full object-cover opacity-25 transition-transform duration-500 group-hover:scale-105"
										/>
									)}
									<div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent" />
									<span className="material-symbols-outlined absolute right-lg top-lg text-5xl text-primary opacity-25">
										sports_esports
									</span>
									<div className="relative">
										<p className="font-caption text-caption uppercase tracking-[0.05em] text-primary">
											{String(index + 1).padStart(2, "0")}
										</p>
										<h3 className="mt-xs font-h3 text-h3 text-on-surface">
											{summary.name}
										</h3>
										<p className="mt-xs text-sm leading-relaxed text-on-surface-variant">
											{summary.challengeCount} active mission
											{summary.challengeCount > 1 ? "s" : ""} with a{" "}
											{formatCompactNumber(summary.topReward)} XP top reward.
										</p>
									</div>
								</NavLink>
							))
						) : (
							<div className="glass-panel rounded-xl p-lg text-center text-on-surface-variant md:col-span-4">
								Les jeux actifs apparaitront ici apres le chargement des
								challenges.
							</div>
						)}
						<div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-xl border-t-2 border-t-primary p-lg md:col-span-4 md:flex-row md:items-center">
							<div className="flex items-center gap-md">
								<div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary-container/20 text-primary">
									<span className="material-symbols-outlined text-3xl">
										military_tech
									</span>
								</div>
								<div>
									<p className="font-caption text-caption uppercase tracking-[0.05em] text-primary">
										Leaderboard Signal
									</p>
									<h3 className="font-h3 text-h3 text-on-surface">
										{topHunter
											? `${topHunter.username} leads the hub`
											: "Rankings update with validated proofs"}
									</h3>
								</div>
							</div>
							<p className="mt-md max-w-[42rem] text-on-surface-variant md:mt-0">
								{topHunter
									? `${formatCompactNumber(topHunter.points)} XP from validated runs.`
									: "Once proofs are validated, player points feed the global leaderboard."}
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto grid w-full max-w-container-max grid-cols-1 gap-xl px-md py-20 md:px-xl lg:grid-cols-12">
				<div className="lg:col-span-5">
					<h2 className="font-h2 text-h2 text-on-surface">Elite Rankings</h2>
					<p className="mt-sm text-on-surface-variant">
						The strongest proof always rises. See who is defining the current
						meta across the hub.
					</p>
					<NavLink to="/leaderboard" className="mt-lg inline-flex">
						<Button variant="secondary">
							Open Leaderboard
							<span className="material-symbols-outlined">leaderboard</span>
						</Button>
					</NavLink>
				</div>
				<div className="lg:col-span-7">
					{leaderboardError ? (
						<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
							Impossible de charger le leaderboard.
						</div>
					) : (
						<Leaderboard
							entries={leaderboard.map((entry) => ({
								...entry,
								avatarUrl: entry.avatarUrl ?? undefined,
							}))}
							title="Global Top 5"
							subtitle="Latest validated players"
							limit={5}
						/>
					)}
				</div>
			</section>
		</div>
	)
}
