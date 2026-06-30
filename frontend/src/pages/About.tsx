import gwendal from "../assets/gwendal.jpg"
import mael from "../assets/mael.png"
import marco from "../assets/marco.png"
import samy from "../assets/samy.png"
import Avatar from "../components/reusable/Avatar.tsx"

const team = [
	{ name: "Samy Khelfa", role: "Scrum Master", avatar: samy },
	{ name: "Marco Santarossa", role: "Git Master", avatar: marco },
	{ name: "Gwendal Nogues", role: "Lead Dev Front", avatar: gwendal },
	{ name: "Mael Colome", role: "Lead Dev Back", avatar: mael },
]

export default function About() {
	return (
		<div className="mx-auto flex w-full max-w-container-max flex-col gap-xl px-md py-xl md:px-xl">
			<section className="glass-panel-strong overflow-hidden rounded-xl p-lg md:p-xl">
				<p className="font-caption text-caption uppercase tracking-[0.05em] text-tertiary">
					About the hub
				</p>
				<h1 className="mt-sm font-h1 text-h1-mobile text-on-surface md:text-h1">
					Built for verified gaming challenges
				</h1>
				<p className="mt-md max-w-[48rem] text-lead text-on-surface-variant">
					Gamer Challenge is a competitive platform where players publish
					missions, submit proof, and let the community validate standout
					performances.
				</p>
			</section>

			<section>
				<div className="mb-lg flex items-center gap-sm border-b border-white/5 pb-sm">
					<span className="material-symbols-outlined text-primary">groups</span>
					<h2 className="font-h2 text-h2 text-on-surface">
						Gamer Challenge Team
					</h2>
				</div>
				<div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-4">
					{team.map((member) => (
						<article
							key={member.name}
							className="glass-panel neon-glow rounded-xl p-lg text-center"
						>
							<div className="flex justify-center">
								<Avatar src={member.avatar} alt={member.name} size="lg" />
							</div>
							<h3 className="mt-md font-h3 text-[20px] text-on-surface">
								{member.name}
							</h3>
							<p className="mt-xs font-caption text-caption uppercase tracking-[0.05em] text-primary">
								{member.role}
							</p>
						</article>
					))}
				</div>
			</section>

			<section className="grid grid-cols-1 gap-lg lg:grid-cols-3">
				{[
					[
						"Competitive by design",
						"Challenges are structured around clear objectives, rewards, and proof requirements.",
						"flag",
					],
					[
						"Community validated",
						"Submissions can be reviewed and voted on, keeping the leaderboard meaningful.",
						"how_to_vote",
					],
					[
						"Built for growth",
						"The platform is designed to evolve with more games, badges, and ranking formats.",
						"trending_up",
					],
				].map(([title, description, icon]) => (
					<div key={title} className="glass-panel rounded-xl p-lg">
						<span className="material-symbols-outlined text-primary">
							{icon}
						</span>
						<h3 className="mt-md font-h3 text-[20px] text-on-surface">
							{title}
						</h3>
						<p className="mt-sm text-on-surface-variant">{description}</p>
					</div>
				))}
			</section>
		</div>
	)
}
