import { useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { useAuth } from "../context/useAuth"

export default function SignInPage() {
	const { user, signIn } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()

	const isSignUp = location.pathname === "/sign-up"
	const pageTitle = isSignUp ? "Create Account" : "Sign In"
	const subtitle = isSignUp ? "Claim your arena identity" : "Enter the Arena"
	const altPath = isSignUp ? "/sign-in" : "/sign-up"
	const altPrompt = isSignUp ? "Already in the hub?" : "New challenger?"
	const altLink = isSignUp ? "Sign In" : "Create an account"

	useEffect(() => {
		if (user) {
			navigate("/")
		}
	}, [user, navigate])

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-md py-xl text-on-background">
			<div className="kinetic-grid" />
			<div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-transparent to-background" />

			<main className="relative z-10 w-full max-w-[28rem]">
				<div className="mb-xl text-center">
					<Link
						to="/"
						className="font-title text-h1-mobile font-black uppercase text-primary md:text-h1"
					>
						Gamer Challenge
					</Link>
					<p className="mt-sm text-lead text-on-surface-variant">{subtitle}</p>
				</div>

				<div className="glass-panel-strong relative flex flex-col gap-lg overflow-hidden rounded-xl p-lg md:p-xl">
					<div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary-container via-tertiary to-primary-container" />
					<div className="text-center">
						<h1 className="font-h3 text-h3 text-on-surface">{pageTitle}</h1>
						<p className="mt-xs text-on-surface-variant">
							Connect your gaming identity
						</p>
					</div>

					<div className="flex flex-col gap-md">
						<button
							type="button"
							onClick={() => signIn("twitch")}
							className="neon-glow flex w-full items-center justify-center gap-sm rounded-lg bg-[#9146FF] px-lg py-md font-semibold text-white"
						>
							<TwitchIcon />
							Continue with Twitch
						</button>
						<button
							type="button"
							onClick={() => signIn("google")}
							className="neon-glow flex w-full items-center justify-center gap-sm rounded-lg border border-white/20 bg-white/10 px-lg py-md font-semibold text-on-surface hover:bg-white/15"
						>
							<GoogleIcon />
							Continue with Google
						</button>
					</div>

					<div className="flex items-center gap-md">
						<div className="h-px flex-1 bg-white/10" />
						<span className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
							Or
						</span>
						<div className="h-px flex-1 bg-white/10" />
					</div>

					<button
						type="button"
						className="flex items-center justify-center gap-sm rounded-lg border border-white/10 bg-transparent px-lg py-md font-semibold text-on-surface transition-colors hover:bg-white/5"
					>
						<span className="material-symbols-outlined text-[20px]">mail</span>
						Continue with Email
					</button>
				</div>

				<div className="mt-lg text-center font-caption text-caption text-on-surface-variant">
					<p>
						{altPrompt}{" "}
						<Link to={altPath} className="text-primary hover:underline">
							{altLink}
						</Link>
					</p>
					<div className="mt-sm flex items-center justify-center gap-md">
						<Link
							to="/terms-of-service"
							className="hover:text-primary hover:underline"
						>
							Terms of Service
						</Link>
						<span>|</span>
						<Link to="/contact" className="hover:text-primary hover:underline">
							Support
						</Link>
					</div>
				</div>
			</main>
		</div>
	)
}

function TwitchIcon() {
	return (
		<svg
			className="h-6 w-6 fill-current"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
		</svg>
	)
}

function GoogleIcon() {
	return (
		<svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				fill="#4285F4"
			/>
			<path
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				fill="#34A853"
			/>
			<path
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
				fill="#FBBC05"
			/>
			<path
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				fill="#EA4335"
			/>
		</svg>
	)
}
