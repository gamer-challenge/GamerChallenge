import { useState } from "react"
import { NavLink } from "react-router"
import { useAuth } from "../../context/useAuth"
import Button from "../reusable/Button"

const navLinks = [
	{ to: "/", label: "Home" },
	{ to: "/challenges", label: "Challenges" },
	{ to: "/leaderboard", label: "Leaderboard" },
	{ to: "/about", label: "About" },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
	`rounded-lg px-md py-sm font-medium transition-all duration-200 ${
		isActive
			? "bg-white/5 text-primary shadow-[0_0_12px_rgba(124,58,237,0.24)]"
			: "text-on-surface-variant hover:bg-white/5 hover:text-primary"
	}`

export default function NavBar() {
	const [isOpen, setIsOpen] = useState(false)
	const { user, signOut } = useAuth()

	const closeMenu = () => setIsOpen(false)

	return (
		<nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-surface/75 text-on-surface shadow-[0_0_15px_rgba(124,58,237,0.2)] backdrop-blur-xl">
			<div className="mx-auto flex h-[72px] max-w-container-max items-center justify-between gap-lg px-md md:px-xl">
				<NavLink
					to="/"
					className="font-title text-[22px] font-black uppercase text-primary"
					onClick={closeMenu}
				>
					Gamer Challenge
				</NavLink>

				<div className="hidden items-center gap-sm md:flex">
					{navLinks.map((link) => (
						<NavLink key={link.to} to={link.to} className={linkClass}>
							{link.label}
						</NavLink>
					))}
					{user?.role === "admin" && (
						<NavLink to="/admin" className={linkClass}>
							Admin
						</NavLink>
					)}
				</div>

				<div className="hidden items-center gap-sm md:flex">
					{user ? (
						<>
							<NavLink
								to="/account"
								className="flex items-center gap-sm rounded-lg px-md py-sm text-on-surface-variant transition-colors hover:bg-white/5 hover:text-primary"
							>
								<span className="material-symbols-outlined">
									account_circle
								</span>
								<span className="max-w-32 truncate text-sm font-semibold">
									{user.username}
								</span>
							</NavLink>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									void signOut()
								}}
							>
								Sign Out
							</Button>
						</>
					) : (
						<NavLink to="/sign-in">
							<Button size="sm">Sign In</Button>
						</NavLink>
					)}
				</div>

				<button
					type="button"
					className="rounded-lg border border-white/10 p-sm text-on-surface-variant md:hidden"
					onClick={() => setIsOpen((prev) => !prev)}
					aria-label="Open menu"
					aria-expanded={isOpen}
				>
					<span className="material-symbols-outlined">
						{isOpen ? "close" : "menu"}
					</span>
				</button>
			</div>

			{isOpen && (
				<div className="border-t border-white/10 bg-surface-container-low/95 px-md py-md backdrop-blur-xl md:hidden">
					<div className="flex flex-col gap-sm">
						{navLinks.map((link) => (
							<NavLink
								key={link.to}
								to={link.to}
								className={linkClass}
								onClick={closeMenu}
							>
								{link.label}
							</NavLink>
						))}
						{user?.role === "admin" && (
							<NavLink to="/admin" className={linkClass} onClick={closeMenu}>
								Admin
							</NavLink>
						)}
						<div className="mt-sm border-t border-white/10 pt-sm">
							{user ? (
								<div className="flex flex-col gap-sm">
									<NavLink
										to="/account"
										className={linkClass}
										onClick={closeMenu}
									>
										{user.username}
									</NavLink>
									<Button
										variant="ghost"
										size="sm"
										className="justify-start"
										onClick={() => {
											void signOut()
											closeMenu()
										}}
									>
										Sign Out
									</Button>
								</div>
							) : (
								<NavLink to="/sign-in" onClick={closeMenu}>
									<Button size="sm" className="w-full">
										Sign In
									</Button>
								</NavLink>
							)}
						</div>
					</div>
				</div>
			)}
		</nav>
	)
}
