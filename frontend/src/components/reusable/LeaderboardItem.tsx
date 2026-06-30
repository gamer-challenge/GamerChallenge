import Avatar from "./Avatar"

type LeaderboardItemProps = {
	rank: number
	username: string
	points: number
	avatarUrl?: string
}

const rankClasses: Record<number, string> = {
	1: "border-warning/40 bg-warning/10 text-warning",
	2: "border-slate-300/40 bg-slate-300/10 text-slate-200",
	3: "border-orange-400/40 bg-orange-400/10 text-orange-300",
}

export default function LeaderboardItem({
	rank,
	username,
	points,
	avatarUrl,
}: LeaderboardItemProps) {
	const rankClass =
		rankClasses[rank] ??
		"border-white/5 bg-surface-container-low/40 text-on-surface-variant"

	return (
		<div
			className={`table-row-hover grid grid-cols-[48px_1fr_auto] items-center gap-md border-b border-white/5 px-md py-sm last:border-b-0 ${rankClass}`}
		>
			<div className="flex h-9 w-9 items-center justify-center rounded-full border border-current/30 font-caption text-caption font-bold">
				{rank}
			</div>
			<div className="flex min-w-0 items-center gap-md">
				<Avatar src={avatarUrl} alt={username} size="sm" />
				<span className="truncate font-semibold text-on-surface">
					{username}
				</span>
			</div>
			<span className="font-caption text-caption uppercase tracking-[0.05em] text-primary">
				{points.toLocaleString()} XP
			</span>
		</div>
	)
}
