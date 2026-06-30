import { NavLink } from "react-router"

const footerLinks = [
	{ to: "/challenges", label: "Challenges" },
	{ to: "/leaderboard", label: "Leaderboard" },
	{ to: "/about", label: "About" },
	{ to: "/contact", label: "Contact" },
	{ to: "/terms-of-service", label: "Terms" },
]

export default function Footer() {
	return (
		<footer className="border-t border-white/5 bg-surface-dim px-md py-xl text-on-surface-variant md:px-xl">
			<div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-lg md:flex-row">
				<NavLink
					to="/"
					className="font-title text-h3 font-black uppercase text-primary"
				>
					Gamer Challenge
				</NavLink>
				<nav className="flex flex-wrap justify-center gap-md font-caption text-caption uppercase tracking-[0.05em]">
					{footerLinks.map((link) => (
						<NavLink
							key={link.to}
							to={link.to}
							className="transition-colors hover:text-tertiary"
						>
							{link.label}
						</NavLink>
					))}
				</nav>
				<p className="w-full max-w-[20rem] shrink-0 text-center text-sm md:w-64 md:text-right">
					Copyright 2026 Gamer Challenge. Built for verified gaming feats.
				</p>
			</div>
		</footer>
	)
}
