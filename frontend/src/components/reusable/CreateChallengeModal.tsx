import type { FormEvent } from "react"
import { useState } from "react"
import Button from "./Button"

type Props = {
	onClose?: () => void
}

const difficulties = ["easy", "medium", "hard", "extreme", "insane"]

export default function CreateChallengeModal({ onClose }: Props) {
	const [challengeTitle, setChallengeTitle] = useState("")
	const [challengeDescription, setChallengeDescription] = useState("")
	const [challengeRules, setChallengeRules] = useState("")
	const [challengeGame, setChallengeGame] = useState("")
	const [challengePoints, setChallengePoints] = useState(500)
	const [challengeDifficulty, setChallengeDifficulty] = useState(
		difficulties[0],
	)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const createChallenge = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const formData = new FormData(event.currentTarget)

		const newChallengeTitle = formData.get("challengeTitle") as string
		const newChallengeDescription = formData.get(
			"challengeDescription",
		) as string
		const newChallengeRules = formData.get("challengeRules") as string
		const newChallengeGame = Number(formData.get("challengeGame"))
		const newChallengePoints = Number(formData.get("challengePoints"))
		const newChallengeDifficulty = formData.get("challengeDifficulty") as string

		try {
			setLoading(true)
			setError(null)
			const apiBase = import.meta.env.VITE_API_URL || ""
			const url = apiBase
				? `${apiBase}/api/v1/challenges`
				: "/api/v1/challenges"

			const response = await fetch(url, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: newChallengeTitle,
					description: newChallengeDescription,
					rules: newChallengeRules,
					gameId: newChallengeGame,
					rewardPoints: newChallengePoints,
					difficulty: newChallengeDifficulty,
				}),
			})

			if (!response.ok) {
				throw new Error("Failed to create challenge")
			}

			onClose?.()
		} catch (error) {
			console.error("Error creating challenge:", error)
			setError("La creation a echoue, reessaie.")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 z-[70] overflow-y-auto bg-surface/85 px-md py-xl backdrop-blur-md">
			<div className="mx-auto w-full max-w-[64rem]">
				<div className="mb-md flex justify-end">
					<Button variant="ghost" size="sm" onClick={onClose}>
						<span className="material-symbols-outlined">close</span>
						Close
					</Button>
				</div>
				<form
					onSubmit={createChallenge}
					className="glass-panel-strong relative grid grid-cols-1 gap-lg overflow-hidden rounded-xl p-lg md:grid-cols-12 md:p-xl"
				>
					<div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary via-tertiary to-transparent" />
					<header className="border-b border-white/10 pb-md md:col-span-12">
						<p className="font-caption text-caption uppercase tracking-[0.05em] text-tertiary">
							{"SYS.INIT // MISSION.GEN"}
						</p>
						<h2 className="mt-sm font-h1 text-h1-mobile text-on-surface md:text-h1">
							Initialize <span className="text-primary">Mission</span>
						</h2>
						<p className="mt-sm max-w-[42rem] text-on-surface-variant">
							Define the parameters, set the stakes, and publish a new community
							challenge.
						</p>
					</header>

					<div className="space-y-lg md:col-span-8">
						<section className="glass-panel rounded-xl border-t-2 border-t-primary p-lg">
							<div className="mb-md flex items-center gap-sm border-b border-white/5 pb-sm">
								<span className="material-symbols-outlined text-primary">
									fingerprint
								</span>
								<h3 className="font-h3 text-[20px] uppercase text-on-surface">
									Identification
								</h3>
							</div>
							<div className="space-y-md">
								<div className="space-y-xs">
									<label
										htmlFor="challengeTitle"
										className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant"
									>
										{"/// Challenge Designation"}
									</label>
									<input
										id="challengeTitle"
										name="challengeTitle"
										type="text"
										placeholder="e.g. Flawless Raid Run"
										value={challengeTitle}
										onChange={(e) => setChallengeTitle(e.target.value)}
										className="tactical-input px-md py-sm"
										required
									/>
								</div>
								<div className="space-y-xs">
									<label
										htmlFor="challengeDescription"
										className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant"
									>
										{"/// Briefing"}
									</label>
									<input
										id="challengeDescription"
										name="challengeDescription"
										type="text"
										placeholder="Describe the objective"
										value={challengeDescription}
										onChange={(e) => setChallengeDescription(e.target.value)}
										className="tactical-input px-md py-sm"
										required
									/>
								</div>
								<div className="space-y-xs">
									<label
										htmlFor="challengeGame"
										className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant"
									>
										{"/// Target Environment"}
									</label>
									<select
										id="challengeGame"
										name="challengeGame"
										value={challengeGame}
										onChange={(e) => setChallengeGame(e.target.value)}
										className="tactical-input px-md py-sm"
										required
									>
										<option value="">Select a game</option>
										<option value="1">Game 1</option>
										<option value="2">Game 2</option>
										<option value="3">Game 3</option>
									</select>
								</div>
							</div>
						</section>

						<section className="glass-panel rounded-xl border-t-2 border-t-tertiary p-lg">
							<div className="mb-md flex items-center gap-sm border-b border-white/5 pb-sm">
								<span className="material-symbols-outlined text-tertiary">
									gavel
								</span>
								<h3 className="font-h3 text-[20px] uppercase text-on-surface">
									Rules of Engagement
								</h3>
							</div>
							<div className="space-y-xs">
								<label
									htmlFor="challengeRules"
									className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant"
								>
									{"/// Execution Parameters"}
								</label>
								<textarea
									id="challengeRules"
									name="challengeRules"
									placeholder="- Must complete under 15 minutes&#10;- No exploits&#10;- Full unedited VOD required"
									value={challengeRules}
									onChange={(e) => setChallengeRules(e.target.value)}
									className="tactical-input min-h-40 resize-y px-md py-sm font-mono text-sm"
									rows={6}
									required
								/>
							</div>
						</section>
					</div>

					<div className="space-y-lg md:col-span-4">
						<section className="glass-panel rounded-xl border-t-2 border-t-inverse-primary p-lg">
							<div className="mb-md flex items-center gap-sm border-b border-white/5 pb-sm">
								<span className="material-symbols-outlined text-inverse-primary">
									tune
								</span>
								<h3 className="font-h3 text-[20px] uppercase text-on-surface">
									Parameters
								</h3>
							</div>
							<div className="space-y-md">
								<div>
									<p className="mb-sm font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
										{"/// Threat Level"}
									</p>
									<div className="grid grid-cols-2 gap-sm">
										{difficulties.map((difficulty) => {
											const selected = challengeDifficulty === difficulty
											return (
												<label
													key={difficulty}
													className={`cursor-pointer rounded-lg border px-sm py-sm text-center font-caption text-caption uppercase tracking-[0.05em] transition-all ${
														selected
															? "border-primary bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(124,58,237,0.4)]"
															: "border-outline-variant text-on-surface-variant hover:bg-surface-variant/50"
													}`}
												>
													<input
														type="radio"
														name="challengeDifficulty"
														value={difficulty}
														checked={selected}
														onChange={(e) =>
															setChallengeDifficulty(e.target.value)
														}
														className="sr-only"
													/>
													{difficulty}
												</label>
											)
										})}
									</div>
								</div>

								<div className="space-y-xs">
									<label
										htmlFor="challengePoints"
										className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant"
									>
										{"/// Bounty XP"}
									</label>
									<div className="relative">
										<span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-tertiary">
											stars
										</span>
										<input
											id="challengePoints"
											name="challengePoints"
											type="number"
											min="100"
											max="10000"
											step="100"
											value={challengePoints}
											onChange={(e) =>
												setChallengePoints(Number(e.target.value))
											}
											className="tactical-input px-md py-sm pl-xl font-mono text-tertiary"
											required
										/>
									</div>
								</div>
							</div>
						</section>

						<section className="glass-panel rounded-xl border-t-2 border-t-secondary p-lg">
							<div className="mb-md flex items-center gap-sm border-b border-white/5 pb-sm">
								<span className="material-symbols-outlined text-secondary">
									wallpaper
								</span>
								<h3 className="font-h3 text-[20px] uppercase text-on-surface">
									Visual Intel
								</h3>
							</div>
							<div className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest p-lg text-center transition-colors hover:border-primary hover:bg-surface-variant/30">
								<span className="material-symbols-outlined mb-sm text-4xl text-primary">
									upload_file
								</span>
								<p className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface">
									Cover upload coming soon
								</p>
								<p className="mt-xs text-xs text-outline">1920x1080 JPG/PNG</p>
							</div>
						</section>
					</div>

					{error && (
						<p className="rounded-lg border border-error/30 bg-error-container/20 px-md py-sm text-sm text-error md:col-span-12">
							{error}
						</p>
					)}

					<div className="flex justify-end gap-md border-t border-white/10 pt-md md:col-span-12">
						<Button variant="ghost" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Deploying..." : "Deploy Mission"}
							<span className="material-symbols-outlined">rocket_launch</span>
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}
