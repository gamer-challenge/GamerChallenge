import LeaderboardItem from "./LeaderboardItem"

type LeaderboardEntry = {
	id: number | string
	username: string
	points: number
	avatarUrl?: string
}

type LeaderboardProps = {
	entries: LeaderboardEntry[]
	className?: string
	title?: string
	subtitle?: string
	limit?: number
}

export default function Leaderboard({
	entries,
	className = "",
	title = "Leaderboard",
	subtitle = "Top validated runs",
	limit,
}: LeaderboardProps) {
	const visibleEntries =
		typeof limit === "number" ? entries.slice(0, limit) : entries

	return (
		<section className={`glass-panel overflow-hidden rounded-xl ${className}`}>
			<div className="flex items-center justify-between gap-md border-b border-white/10 bg-surface-container/50 px-lg py-md">
				<div>
					<h2 className="font-h3 text-[20px] text-on-surface">{title}</h2>
					<p className="text-sm text-on-surface-variant">{subtitle}</p>
				</div>
				<span className="material-symbols-outlined text-primary">
					leaderboard
				</span>
			</div>
			<div>
				{visibleEntries.length > 0 ? (
					visibleEntries.map((entry, index) => (
						<LeaderboardItem
							key={entry.id}
							rank={index + 1}
							username={entry.username}
							points={entry.points}
							avatarUrl={entry.avatarUrl}
						/>
					))
				) : (
					<p className="px-lg py-xl text-center text-sm text-on-surface-variant">
						No ranked players yet.
					</p>
				)}
			</div>
		</section>
	)
}
