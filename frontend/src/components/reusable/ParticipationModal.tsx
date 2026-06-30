import { useState } from "react"
import { api } from "../../lib/api"
import Button from "./Button"

type Props = {
	visible: boolean
	onClose?: () => void
	challengeId?: number
	challengeTitle?: string
	challengeGame?: string
	challengeImage?: string | null
}

export default function ParticipationModal({
	visible,
	onClose,
	challengeId,
	challengeTitle = "Target Challenge",
	challengeGame = "Gamer Challenge",
	challengeImage,
}: Props) {
	const [videoLink, setVideoLink] = useState("")
	const [screenshotUrl, setScreenshotUrl] = useState("")
	const [description, setDescription] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const submitParticipation = async () => {
		if (!challengeId) {
			setError("Challenge introuvable.")
			return
		}

		const trimmedVideoLink = videoLink.trim()
		const trimmedScreenshotUrl = screenshotUrl.trim()
		const trimmedDescription = description.trim()

		if (!trimmedVideoLink) {
			setError("Le lien de la video est obligatoire.")
			return
		}

		try {
			setLoading(true)
			setError(null)

			const payload = {
				videoUrl: trimmedVideoLink,
				screenshotUrl: trimmedScreenshotUrl || null,
				description: trimmedDescription || null,
			}

			const subscriptionResponse = await api.subscribeToChallenge(challengeId)

			if (!subscriptionResponse.ok) {
				throw new Error(await getApiError(subscriptionResponse))
			}

			const response = await api.submitChallengeSubmission(challengeId, payload)

			if (!response.ok) throw new Error(await getApiError(response))

			setScreenshotUrl("")
			setVideoLink("")
			setDescription("")
			if (onClose) onClose()
		} catch (err) {
			console.error("Error:", err)
			setError(
				err instanceof Error
					? err.message
					: "La soumission a echoue, reessaie.",
			)
		} finally {
			setLoading(false)
		}
	}

	if (!visible) return null

	return (
		<div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-surface/85 px-md py-xl backdrop-blur-md">
			<div className="glass-panel-strong relative w-full max-w-[48rem] overflow-hidden rounded-xl p-lg md:p-xl">
				<div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary-container via-tertiary to-primary-container" />
				<button
					type="button"
					onClick={onClose}
					className="absolute right-md top-md rounded-full p-sm text-on-surface-variant transition-colors hover:bg-white/5 hover:text-primary"
					aria-label="Close submission modal"
				>
					<span className="material-symbols-outlined">close</span>
				</button>

				<div className="mb-xl text-center">
					<span className="material-symbols-outlined mb-md text-5xl text-primary">
						cloud_upload
					</span>
					<h2 className="font-h2 text-h2 text-on-surface">Submit Proof</h2>
					<p className="mt-sm text-on-surface-variant">
						Validate your achievement for community review.
					</p>
				</div>

				<div className="mb-xl flex items-center gap-lg rounded-lg border border-outline-variant/30 bg-surface-container-lowest/60 p-md">
					<div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-surface-container-high">
						{challengeImage ? (
							<img
								src={challengeImage}
								alt={challengeTitle}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center">
								<span className="material-symbols-outlined text-4xl text-primary">
									sports_esports
								</span>
							</div>
						)}
					</div>
					<div className="min-w-0">
						<p className="font-caption text-caption uppercase tracking-[0.05em] text-secondary">
							Target Challenge
						</p>
						<h3 className="truncate font-h3 text-[22px] text-on-surface">
							{challengeTitle}
						</h3>
						<span className="mt-sm inline-flex rounded-full border border-primary/30 bg-primary-container/20 px-3 py-1 font-caption text-caption uppercase tracking-[0.05em] text-primary">
							{challengeGame}
						</span>
					</div>
				</div>

				<form
					className="space-y-lg"
					onSubmit={(event) => {
						event.preventDefault()
						void submitParticipation()
					}}
				>
					<div className="space-y-sm">
						<label
							htmlFor="videoLink"
							className="flex items-center gap-xs font-lead text-lead text-on-surface"
						>
							<span className="material-symbols-outlined text-[20px] text-primary">
								link
							</span>
							Video Evidence URL
						</label>
						<input
							id="videoLink"
							name="videoLink"
							type="url"
							placeholder="https://twitch.tv/videos/..."
							value={videoLink}
							onChange={(e) => setVideoLink(e.target.value)}
							className="tactical-input px-md py-md"
							required
						/>
						<p className="font-caption text-caption text-on-surface-variant">
							Provide a direct link to the uncut VOD.
						</p>
					</div>

					<div className="space-y-sm">
						<label
							htmlFor="screenshotUrl"
							className="flex items-center gap-xs font-lead text-lead text-on-surface"
						>
							<span className="material-symbols-outlined text-[20px] text-primary">
								image
							</span>
							Screenshot URL
						</label>
						<input
							id="screenshotUrl"
							name="screenshotUrl"
							type="url"
							placeholder="https://.../screenshot.png"
							value={screenshotUrl}
							onChange={(e) => setScreenshotUrl(e.target.value)}
							className="tactical-input px-md py-md"
						/>
					</div>

					<div className="space-y-sm">
						<label
							htmlFor="description"
							className="flex items-center gap-xs font-lead text-lead text-on-surface"
						>
							<span className="material-symbols-outlined text-[20px] text-primary">
								notes
							</span>
							Submission Notes
						</label>
						<textarea
							id="description"
							name="description"
							placeholder="Add run details, timestamps, loadout info..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="tactical-input min-h-32 resize-y px-md py-md"
							rows={4}
						/>
					</div>

					{error && (
						<p className="rounded-lg border border-error/30 bg-error-container/20 px-md py-sm text-sm text-error">
							{error}
						</p>
					)}

					<div className="border-t border-white/5 pt-md">
						<Button
							type="submit"
							size="lg"
							className="w-full"
							disabled={loading}
						>
							<span className="material-symbols-outlined">check_circle</span>
							{loading ? "Submitting..." : "Submit Proof"}
						</Button>
						<div className="mt-md flex items-start gap-sm rounded-lg border border-outline-variant/20 bg-surface-container/50 p-md text-on-surface-variant">
							<span className="material-symbols-outlined mt-0.5 shrink-0 text-tertiary">
								policy
							</span>
							<p className="font-caption text-caption leading-relaxed">
								All submissions enter community voting. Keep the evidence public
								while the run is being reviewed.
							</p>
						</div>
					</div>
				</form>
			</div>
		</div>
	)
}

async function getApiError(response: Response) {
	try {
		const data = (await response.json()) as { error?: unknown }

		if (typeof data.error === "string" && data.error.trim()) {
			return data.error
		}
	} catch {
		// Keep the generic fallback below when the API did not return JSON.
	}

	return "La soumission a echoue, reessaie."
}
