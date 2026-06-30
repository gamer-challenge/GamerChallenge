const terms = [
	{
		title: "User Conduct",
		body: "Use Gamer Challenge lawfully and respectfully. Do not disrupt the platform, abuse voting, or submit manipulated proof.",
	},
	{
		title: "Content Ownership",
		body: "Content remains owned by its creators. By submitting proof, you allow Gamer Challenge to display it for validation and ranking.",
	},
	{
		title: "Privacy",
		body: "We protect account information and use authentication data only to operate the platform experience.",
	},
	{
		title: "Moderation",
		body: "Invalid evidence, harassment, or rule abuse can lead to rejected submissions, removed content, or suspended access.",
	},
	{
		title: "Updates",
		body: "Terms can be updated as the platform grows. Continued use after changes means acceptance of the latest terms.",
	},
]

export default function TermsOfService() {
	return (
		<div className="mx-auto flex w-full max-w-container-max flex-col gap-xl px-md py-xl md:px-xl">
			<section className="glass-panel-strong rounded-xl p-lg md:p-xl">
				<p className="font-caption text-caption uppercase tracking-[0.05em] text-tertiary">
					Legal
				</p>
				<h1 className="mt-sm font-h1 text-h1-mobile text-on-surface md:text-h1">
					Terms of Service
				</h1>
				<p className="mt-md max-w-[48rem] text-on-surface-variant">
					By using Gamer Challenge, you agree to follow the rules that keep the
					platform fair, competitive, and useful for the community.
				</p>
			</section>

			<section className="grid grid-cols-1 gap-lg md:grid-cols-2">
				{terms.map((term, index) => (
					<article
						key={term.title}
						className="glass-panel rounded-xl border-t-2 border-t-primary p-lg"
					>
						<p className="font-caption text-caption uppercase tracking-[0.05em] text-primary">
							{String(index + 1).padStart(2, "0")}
						</p>
						<h2 className="mt-sm font-h3 text-h3 text-on-surface">
							{term.title}
						</h2>
						<p className="mt-sm text-on-surface-variant">{term.body}</p>
					</article>
				))}
			</section>
		</div>
	)
}
