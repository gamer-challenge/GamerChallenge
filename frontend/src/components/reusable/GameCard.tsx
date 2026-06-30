import { Link } from "react-router"
import PointsBadge from "./PointsBadge"

const difficultyLabels: Record<string, string> = {
	easy: "Standard",
	medium: "Advanced",
	hard: "Hard",
	extreme: "Extreme",
	insane: "Elite",
}

const difficultyClasses: Record<string, string> = {
	easy: "text-tertiary border-tertiary/30 bg-tertiary-container/20",
	medium: "text-warning border-warning/30 bg-warning/10",
	hard: "text-orange-300 border-orange-300/30 bg-orange-400/10",
	extreme: "text-error border-error/40 bg-error-container/25",
	insane: "text-primary border-primary/40 bg-primary-container/25",
}

const accentClasses: Record<string, string> = {
	easy: "bg-tertiary",
	medium: "bg-warning",
	hard: "bg-orange-300",
	extreme: "bg-error",
	insane: "bg-primary",
	default: "bg-primary",
}

type GameCardProps = {
	id: number | string
	title: string
	game: string
	points: number
	difficulty?: string
	imageUrl?: string
	location?: string
	description?: string
	progress?: number
}

export default function GameCard({
	id,
	title,
	game,
	points,
	difficulty,
	imageUrl,
	location,
	description,
	progress,
}: GameCardProps) {
	const normalizedDifficulty = difficulty?.toLowerCase() ?? "default"
	const difficultyLabel =
		difficultyLabels[normalizedDifficulty] ?? difficulty ?? "Challenge"
	const difficultyClass =
		difficultyClasses[normalizedDifficulty] ??
		"text-primary border-primary/30 bg-primary-container/20"
	const accentClass =
		accentClasses[normalizedDifficulty] ?? accentClasses.default
	const completion =
		typeof progress === "number"
			? Math.max(0, Math.min(100, Math.round(progress)))
			: null

	return (
		<article className="glass-panel neon-glow group relative flex min-h-[320px] flex-col overflow-hidden rounded-xl">
			<div className={`absolute left-0 top-0 h-1 w-full ${accentClass}`} />
			<div className="relative h-44 overflow-hidden bg-surface-container-high">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={title}
						className="h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-surface-container-low">
						<span className="material-symbols-outlined text-6xl text-primary/60">
							sports_esports
						</span>
					</div>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/10 to-transparent" />
				<span
					className={`absolute right-md top-md inline-flex items-center gap-1 rounded-full border px-3 py-1 font-caption text-caption uppercase tracking-[0.05em] backdrop-blur-md ${difficultyClass}`}
				>
					<span className="material-symbols-outlined text-[16px]">
						local_fire_department
					</span>
					{difficultyLabel}
				</span>
			</div>

			<div className="flex flex-1 flex-col p-md">
				<p className="font-caption text-caption uppercase tracking-[0.05em] text-secondary">
					{game}
				</p>
				<h3 className="mt-2 font-h3 text-[20px] leading-snug text-on-surface">
					{title}
				</h3>
				<p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-on-surface-variant">
					{description ??
						"Complete the objective, submit proof, and let the community validate your run."}
				</p>

				{completion !== null && (
					<div className="mt-md space-y-sm">
						<div className="flex items-center justify-between font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
							<span>Completion</span>
							<span className="text-tertiary">{completion}%</span>
						</div>
						<div className="h-2 overflow-hidden rounded-full bg-surface-container-lowest">
							<div
								className="h-full rounded-full bg-gradient-to-r from-tertiary-fixed-dim to-tertiary shadow-[0_0_10px_rgba(78,222,163,0.5)]"
								style={{ width: `${completion}%` }}
							/>
						</div>
					</div>
				)}

				<div className="mt-md flex items-center justify-between gap-md border-t border-white/5 pt-md">
					<PointsBadge points={points} />
					{location !== "account" && (
						<Link
							to={`/challenges/${id}`}
							className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-on-surface transition-colors hover:text-primary"
						>
							Open
							<span className="material-symbols-outlined text-[18px]">
								arrow_forward
							</span>
						</Link>
					)}
				</div>
			</div>
		</article>
	)
}
