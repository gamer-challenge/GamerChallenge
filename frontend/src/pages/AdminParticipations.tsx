import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import Avatar from "../components/reusable/Avatar"
import Button from "../components/reusable/Button"
import { useAuth } from "../context/useAuth"
import { api } from "../lib/api"

type Participation = {
	id: number
	status: "pending" | "validated" | "rejected" | "removed"
	videoUrl: string
	screenshotUrl: string | null
	description: string | null
	upvotes: number
	downvotes: number
	createdAt: string
	player: {
		id: string
		username: string
		avatarUrl: string | null
	}
	challenge: {
		id: number
		title: string
		slug: string
		rewardPoints: number
	}
}

const STATUS_FILTER_OPTIONS = [
	"pending",
	"validated",
	"rejected",
	"removed",
] as const
type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]

const STATUS_LABELS: Record<string, string> = {
	pending: "Pending",
	validated: "Validated",
	rejected: "Rejected",
	removed: "Removed",
}

const STATUS_COLORS: Record<string, string> = {
	pending: "text-warning border-warning/40 bg-warning/10",
	validated: "text-tertiary border-tertiary/40 bg-tertiary-container/20",
	rejected: "text-error border-error/40 bg-error-container/20",
	removed: "text-on-surface-variant border-white/15 bg-white/5",
}

export default function AdminParticipations() {
	const { user, loading: authLoading } = useAuth()
	const navigate = useNavigate()
	const [participations, setParticipations] = useState<Participation[]>([])
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending")
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [updating, setUpdating] = useState<number | null>(null)

	useEffect(() => {
		if (!authLoading && (!user || user.role !== "admin")) {
			navigate("/")
		}
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (!user || user.role !== "admin") return
		let ignore = false

		api
			.getParticipations(statusFilter)
			.then((res) => {
				if (!res.ok) throw new Error("Failed to load participations")
				return res.json()
			})
			.then((data: Participation[]) => {
				if (!ignore) setParticipations(data)
			})
			.catch((err: Error) => {
				if (!ignore) setError(err.message)
			})
			.finally(() => {
				if (!ignore) setLoading(false)
			})

		return () => {
			ignore = true
		}
	}, [user, statusFilter])

	async function handleStatusChange(
		id: number,
		newStatus: "validated" | "rejected" | "removed",
	) {
		setUpdating(id)
		try {
			const res = await api.updateParticipationStatus(id, newStatus)
			if (!res.ok) throw new Error("Failed to update status")
			setParticipations((prev) =>
				prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
			)
		} catch {
			setError("Failed to update participation status")
		} finally {
			setUpdating(null)
		}
	}

	if (authLoading) {
		return (
			<div className="flex min-h-[60svh] items-center justify-center px-md">
				<div className="glass-panel rounded-xl p-xl text-on-surface-variant">
					Chargement...
				</div>
			</div>
		)
	}

	if (!user || user.role !== "admin") return null

	return (
		<div className="mx-auto flex w-full max-w-container-max flex-col gap-xl px-md py-xl md:px-xl">
			<header className="flex flex-col justify-between gap-md md:flex-row md:items-end">
				<div>
					<p className="font-caption text-caption uppercase tracking-[0.05em] text-tertiary">
						Moderation Console
					</p>
					<h1 className="mt-sm font-h1 text-h1-mobile text-on-surface md:text-h1">
						Participations
					</h1>
					<p className="mt-sm max-w-[42rem] text-on-surface-variant">
						Review submitted proof, validate clean runs, and reject invalid
						evidence before it reaches the leaderboard.
					</p>
				</div>
				<div className="glass-panel rounded-lg p-sm">
					<div className="flex flex-wrap gap-sm">
						{STATUS_FILTER_OPTIONS.map((status) => (
							<button
								key={status}
								type="button"
								onClick={() => {
									if (statusFilter === status) return
									setLoading(true)
									setError(null)
									setStatusFilter(status)
								}}
								className={`rounded px-md py-sm font-caption text-caption uppercase tracking-[0.05em] transition-colors ${
									statusFilter === status
										? "bg-primary-container text-on-primary-container shadow-[0_0_10px_rgba(124,58,237,0.3)]"
										: "text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary"
								}`}
							>
								{STATUS_LABELS[status]}
							</button>
						))}
					</div>
				</div>
			</header>

			{error && (
				<p className="rounded-xl border border-error/30 bg-error-container/20 p-md text-error">
					{error}
				</p>
			)}

			{loading ? (
				<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
					Chargement...
				</div>
			) : participations.length === 0 ? (
				<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
					No {statusFilter} participations.
				</div>
			) : (
				<div className="grid grid-cols-1 gap-lg">
					{participations.map((participation) => (
						<article
							key={participation.id}
							className="glass-panel rounded-xl p-lg"
						>
							<div className="flex flex-col justify-between gap-md md:flex-row md:items-start">
								<div className="flex items-center gap-md">
									<Avatar
										src={participation.player.avatarUrl ?? undefined}
										alt={participation.player.username}
										size="md"
									/>
									<div>
										<p className="font-semibold text-on-surface">
											{participation.player.username}
										</p>
										<p className="font-caption text-caption text-on-surface-variant">
											{new Date(participation.createdAt).toLocaleDateString(
												"fr-FR",
												{
													day: "numeric",
													month: "short",
													year: "numeric",
												},
											)}
										</p>
									</div>
								</div>
								<span
									className={`self-start rounded-full border px-3 py-1 font-caption text-caption uppercase tracking-[0.05em] ${STATUS_COLORS[participation.status]}`}
								>
									{STATUS_LABELS[participation.status]}
								</span>
							</div>

							<div className="mt-lg grid grid-cols-1 gap-md md:grid-cols-2">
								<InfoBlock
									label="Challenge"
									value={participation.challenge.title}
									subvalue={`+${participation.challenge.rewardPoints.toLocaleString()} XP`}
								/>
								<div>
									<p className="mb-xs font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
										Video
									</p>
									<a
										href={participation.videoUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="break-all text-sm text-primary underline underline-offset-4"
									>
										{participation.videoUrl}
									</a>
								</div>
								{participation.screenshotUrl && (
									<div>
										<p className="mb-xs font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
											Screenshot
										</p>
										<a
											href={participation.screenshotUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="break-all text-sm text-primary underline underline-offset-4"
										>
											{participation.screenshotUrl}
										</a>
									</div>
								)}
								<div>
									<p className="mb-xs font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
										Votes
									</p>
									<p className="text-on-surface">
										<span className="text-tertiary">
											{participation.upvotes}
										</span>{" "}
										up /{" "}
										<span className="text-error">
											{participation.downvotes}
										</span>{" "}
										down
									</p>
								</div>
								{participation.description && (
									<div className="md:col-span-2">
										<p className="mb-xs font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
											Description
										</p>
										<p className="whitespace-pre-line rounded-lg border border-white/5 bg-surface-container/50 p-md text-sm text-on-surface-variant">
											{participation.description}
										</p>
									</div>
								)}
							</div>

							<div className="mt-lg flex flex-wrap gap-md border-t border-white/10 pt-md">
								{participation.status !== "validated" &&
									participation.status !== "removed" && (
										<>
											<Button
												size="sm"
												variant="tertiary"
												disabled={updating === participation.id}
												onClick={() =>
													handleStatusChange(participation.id, "validated")
												}
											>
												{updating === participation.id ? "..." : "Approve"}
											</Button>
											<Button
												size="sm"
												variant="danger"
												disabled={updating === participation.id}
												onClick={() =>
													handleStatusChange(participation.id, "rejected")
												}
											>
												{updating === participation.id ? "..." : "Reject"}
											</Button>
										</>
									)}

								{participation.status === "validated" && (
									<Button
										size="sm"
										variant="danger"
										disabled={updating === participation.id}
										onClick={() =>
											handleStatusChange(participation.id, "rejected")
										}
									>
										{updating === participation.id
											? "..."
											: "Revoke validation"}
									</Button>
								)}
							</div>
						</article>
					))}
				</div>
			)}
		</div>
	)
}

function InfoBlock({
	label,
	value,
	subvalue,
}: {
	label: string
	value: string
	subvalue?: string
}) {
	return (
		<div>
			<p className="mb-xs font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
				{label}
			</p>
			<p className="font-semibold text-on-surface">{value}</p>
			{subvalue && (
				<p className="text-sm font-semibold text-primary">{subvalue}</p>
			)}
		</div>
	)
}
