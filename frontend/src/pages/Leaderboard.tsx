import { useEffect, useMemo, useState } from "react"
import { Leaderboard } from "../components/reusable"
import Avatar from "../components/reusable/Avatar"
import { api } from "../lib/api"
import type { Challenge } from "../types/challenge"

type LeaderboardEntry = {
	id: string
	username: string
	points: number
	avatarUrl: string | null
}

type LeaderboardFilter = "all" | "month" | "game"
type GameOption = {
	id: number
	name: string
}

export default function LeaderboardPage() {
	const [entries, setEntries] = useState<LeaderboardEntry[]>([])
	const [gameOptions, setGameOptions] = useState<GameOption[]>([])
	const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
	const [activeFilter, setActiveFilter] = useState<LeaderboardFilter>("all")
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)
	const [gamesError, setGamesError] = useState(false)
	const effectiveGameId =
		activeFilter === "game"
			? (selectedGameId ?? gameOptions[0]?.id ?? null)
			: null

	useEffect(() => {
		if (activeFilter === "game" && !effectiveGameId) {
			return
		}

		let ignore = false

		api
			.getLeaderboard({
				gameId:
					activeFilter === "game" ? (effectiveGameId ?? undefined) : undefined,
				limit: 50,
				period: activeFilter === "month" ? "month" : "all",
			})
			.then((res) => {
				if (!res.ok) throw new Error()
				return res.json()
			})
			.then((data: unknown) => {
				if (!ignore && Array.isArray(data)) setEntries(data)
			})
			.catch(() => {
				if (!ignore) setError(true)
			})
			.finally(() => {
				if (!ignore) setLoading(false)
			})

		return () => {
			ignore = true
		}
	}, [activeFilter, effectiveGameId])

	useEffect(() => {
		api
			.getChallenges()
			.then((res) => {
				if (!res.ok) throw new Error()
				return res.json()
			})
			.then((data: Challenge[]) => {
				const options = Array.from(
					new Map(
						data.map((challenge) => [
							challenge.game.id,
							{ id: challenge.game.id, name: challenge.game.name },
						]),
					).values(),
				).sort((a, b) => a.name.localeCompare(b.name))

				setGameOptions(options)
			})
			.catch(() => setGamesError(true))
	}, [])

	const podium = useMemo(() => entries.slice(0, 3), [entries])
	const tableEntries = entries.slice(3)
	const selectedGame = gameOptions.find((game) => game.id === selectedGameId)
	const heading =
		activeFilter === "month"
			? "Monthly Leaderboard"
			: activeFilter === "game"
				? `${selectedGame?.name ?? "Game"} Leaderboard`
				: "Global Leaderboard"
	const subtitle =
		activeFilter === "month"
			? "Validated runs submitted since the start of this month."
			: activeFilter === "game"
				? `Validated runs ranked for ${selectedGame?.name ?? "the selected game"}.`
				: "The elite players defining the current meta."

	const activateFilter = (filter: LeaderboardFilter) => {
		setError(false)
		setActiveFilter(filter)

		if (filter === "game") {
			if (!selectedGameId && gameOptions[0]) {
				setSelectedGameId(gameOptions[0].id)
				setLoading(true)
				return
			}

			if (!selectedGameId) {
				setEntries([])
			}
			setLoading(Boolean(selectedGameId))
			return
		}

		setLoading(true)
	}

	return (
		<div className="mx-auto grid w-full max-w-container-max grid-cols-1 gap-xl px-md py-xl md:px-xl lg:grid-cols-12">
			<div className="flex flex-col gap-xl lg:col-span-9">
				<header className="flex flex-col justify-between gap-md md:flex-row md:items-end">
					<div>
						<p className="font-caption text-caption uppercase tracking-[0.05em] text-tertiary">
							Global Rankings
						</p>
						<h1 className="mt-sm font-h1 text-h1-mobile text-on-surface md:text-h1">
							{heading}
						</h1>
						<p className="mt-sm max-w-[42rem] text-lead text-on-surface-variant">
							{subtitle}
						</p>
					</div>
					<div className="glass-panel rounded-lg p-sm">
						<div className="flex flex-col gap-sm">
							<div className="flex gap-sm overflow-x-auto">
								<FilterButton
									active={activeFilter === "all"}
									onClick={() => activateFilter("all")}
								>
									All Time
								</FilterButton>
								<FilterButton
									active={activeFilter === "month"}
									onClick={() => activateFilter("month")}
								>
									This Month
								</FilterButton>
								<FilterButton
									active={activeFilter === "game"}
									onClick={() => {
										activateFilter("game")
									}}
								>
									By Game
								</FilterButton>
							</div>
							{activeFilter === "game" && (
								<div className="flex flex-col gap-xs">
									<select
										value={effectiveGameId ?? ""}
										onChange={(event) => {
											setError(false)
											setLoading(true)
											setSelectedGameId(Number(event.target.value) || null)
										}}
										className="tactical-input px-md py-sm font-caption text-caption uppercase tracking-[0.05em]"
										disabled={gameOptions.length === 0}
									>
										<option value="">
											{gamesError ? "Games unavailable" : "Select a game"}
										</option>
										{gameOptions.map((game) => (
											<option key={game.id} value={game.id}>
												{game.name}
											</option>
										))}
									</select>
									{gamesError && (
										<p className="text-xs text-error">
											Impossible de charger la liste des jeux.
										</p>
									)}
								</div>
							)}
						</div>
					</div>
				</header>

				{loading ? (
					<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
						Chargement...
					</div>
				) : error ? (
					<div className="rounded-xl border border-error/30 bg-error-container/20 p-xl text-center text-error">
						Impossible de charger le leaderboard.
					</div>
				) : (
					<>
						<section className="glass-panel relative flex h-[420px] items-end justify-center gap-md overflow-hidden rounded-xl p-lg md:gap-lg md:p-xl">
							<div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-container-high/55 to-transparent" />
							{podium.length > 0 ? (
								<>
									<PodiumCard entry={podium[1]} rank={2} height="h-[120px]" />
									<PodiumCard
										entry={podium[0]}
										rank={1}
										height="h-[168px]"
										featured
									/>
									<PodiumCard entry={podium[2]} rank={3} height="h-[96px]" />
								</>
							) : (
								<p className="relative z-10 text-on-surface-variant">
									No ranked players yet.
								</p>
							)}
						</section>

						<Leaderboard
							entries={tableEntries.map((entry) => ({
								...entry,
								avatarUrl: entry.avatarUrl ?? undefined,
							}))}
							title="Ranking Table"
							subtitle={
								activeFilter === "all"
									? "Players after the current podium"
									: "Filtered players after the current podium"
							}
						/>
					</>
				)}
			</div>

			<aside className="flex flex-col gap-lg lg:col-span-3">
				<div className="glass-panel rounded-xl p-lg">
					<h2 className="font-h3 text-h3 text-on-surface">Season Pulse</h2>
					<div className="mt-lg space-y-md">
						<SideStat
							label="Players ranked"
							value={entries.length.toString()}
						/>
						<SideStat
							label="Total XP tracked"
							value={entries
								.reduce((sum, entry) => sum + entry.points, 0)
								.toLocaleString()}
						/>
						<SideStat label="Active tier" value="Elite" />
					</div>
				</div>
				<div className="glass-panel rounded-xl p-lg">
					<p className="font-caption text-caption uppercase tracking-[0.05em] text-primary">
						Validation Rule
					</p>
					<p className="mt-sm text-sm leading-relaxed text-on-surface-variant">
						Only validated submissions contribute to ranking. Rejected or
						removed proofs are excluded from score totals.
					</p>
				</div>
			</aside>
		</div>
	)
}

function FilterButton({
	active,
	children,
	onClick,
}: {
	active: boolean
	children: string
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded px-md py-sm font-caption text-caption uppercase tracking-[0.05em] transition-colors ${
				active
					? "bg-primary-container text-on-primary-container shadow-[0_0_10px_rgba(124,58,237,0.3)]"
					: "text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary"
			}`}
		>
			{children}
		</button>
	)
}

function PodiumCard({
	entry,
	rank,
	height,
	featured = false,
}: {
	entry?: LeaderboardEntry
	rank: 1 | 2 | 3
	height: string
	featured?: boolean
}) {
	if (!entry) {
		return <div className="relative z-10 w-1/3 max-w-[180px]" />
	}

	const rankColor =
		rank === 1
			? "text-warning"
			: rank === 2
				? "text-slate-200"
				: "text-orange-300"
	const pillar =
		rank === 1
			? "bg-gradient-to-br from-warning to-yellow-700"
			: rank === 2
				? "bg-gradient-to-br from-slate-200 to-slate-500"
				: "bg-gradient-to-br from-orange-300 to-orange-800"

	return (
		<div
			className={`relative z-10 flex w-1/3 max-w-[180px] flex-col items-center ${
				featured ? "-translate-y-5" : ""
			}`}
		>
			<div className="relative mb-md">
				{featured && (
					<span className="material-symbols-outlined absolute -top-9 left-1/2 -translate-x-1/2 text-4xl text-warning">
						kid_star
					</span>
				)}
				<Avatar
					src={entry.avatarUrl ?? undefined}
					alt={entry.username}
					size={featured ? "xl" : "lg"}
					className={`border-4 ${rank === 1 ? "border-warning" : rank === 2 ? "border-slate-300" : "border-orange-600"}`}
				/>
				<div className="absolute -bottom-3 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-surface-container font-bold text-on-surface">
					{rank}
				</div>
			</div>
			<p className={`w-full truncate text-center font-bold ${rankColor}`}>
				{entry.username}
			</p>
			<p className="mb-sm font-caption text-caption text-primary">
				{entry.points.toLocaleString()} XP
			</p>
			<div className={`${height} w-full rounded-t-lg ${pillar}`} />
		</div>
	)
}

function SideStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-white/10 bg-surface-container/50 p-md">
			<p className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
				{label}
			</p>
			<p className="mt-xs font-h3 text-h3 text-primary">{value}</p>
		</div>
	)
}
