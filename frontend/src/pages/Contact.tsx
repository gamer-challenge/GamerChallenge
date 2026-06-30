import Button from "../components/reusable/Button"

export default function Contact() {
	return (
		<div className="mx-auto grid w-full max-w-container-max grid-cols-1 gap-xl px-md py-xl md:px-xl lg:grid-cols-12">
			<section className="glass-panel-strong rounded-xl p-lg md:p-xl lg:col-span-5">
				<p className="font-caption text-caption uppercase tracking-[0.05em] text-tertiary">
					Support Channel
				</p>
				<h1 className="mt-sm font-h1 text-h1-mobile text-on-surface md:text-h1">
					Contact Us
				</h1>
				<p className="mt-md text-on-surface-variant">
					Questions about submissions, moderation, partnerships, or platform
					access can be routed through the support inbox.
				</p>
				<a
					href="mailto:gamerchallenge@example.com"
					className="mt-lg inline-flex"
				>
					<Button>
						<span className="material-symbols-outlined">mail</span>
						gamerchallenge@example.com
					</Button>
				</a>
			</section>

			<section className="grid grid-cols-1 gap-lg lg:col-span-7">
				{[
					[
						"What is a challenge?",
						"A challenge is a community mission with a defined objective, reward, and proof requirement.",
						"flag",
					],
					[
						"How are proofs reviewed?",
						"Submissions enter a community validation flow. Moderators can approve, reject, or revoke results when needed.",
						"policy",
					],
					[
						"Can I request a new game?",
						"Yes. Send the game, expected challenge format, and examples of proof standards to support.",
						"sports_esports",
					],
				].map(([title, description, icon]) => (
					<div key={title} className="glass-panel rounded-xl p-lg">
						<div className="flex items-start gap-md">
							<span className="material-symbols-outlined text-primary">
								{icon}
							</span>
							<div>
								<h2 className="font-h3 text-h3 text-on-surface">{title}</h2>
								<p className="mt-sm text-on-surface-variant">{description}</p>
							</div>
						</div>
					</div>
				))}
			</section>
		</div>
	)
}
