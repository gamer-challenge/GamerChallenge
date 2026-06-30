import { Route, Routes, useLocation } from "react-router"
import Nav from "./components/Nav/Navbar.tsx"
import HomePage from "./pages/home.tsx"
import "./App.css"
import Footer from "./components/Footer/Footer.tsx"
import About from "./pages/About.tsx"
import Account from "./pages/Account.tsx"
import AdminPanel from "./pages/AdminPanel.tsx"
import AdminParticipations from "./pages/AdminParticipations.tsx"
import ChallengeSubmissionsPage from "./pages/ChallengeSubmissions.tsx"
import Contact from "./pages/Contact.tsx"
import ChallengePage from "./pages/challenge.tsx"
import ChallengesPage from "./pages/challenges.tsx"
import LeaderboardPage from "./pages/Leaderboard.tsx"
import NotFound from "./pages/NotFound.tsx"
import SignInPage from "./pages/SignIn.tsx"
import TermsOfService from "./pages/Terms-of-service.tsx"

function App() {
	const location = useLocation()
	const isAuthPage =
		location.pathname === "/sign-in" || location.pathname === "/sign-up"

	return (
		<div className="App flex min-h-screen flex-col bg-background text-on-background">
			{!isAuthPage && <Nav />}
			<main
				className={`shell-main flex flex-1 flex-col ${isAuthPage ? "" : "pt-[72px]"}`}
			>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/challenges" element={<ChallengesPage />} />
					<Route
						path="/challenges/:id/submissions"
						element={<ChallengeSubmissionsPage />}
					/>
					<Route path="/challenges/:id" element={<ChallengePage />} />
					<Route path="/leaderboard" element={<LeaderboardPage />} />
					<Route path="/account" element={<Account />} />
					<Route path="/contact" element={<Contact />} />
					<Route path="/terms-of-service" element={<TermsOfService />} />
					<Route path="/about" element={<About />} />
					<Route path="/sign-in" element={<SignInPage />} />
					<Route path="/sign-up" element={<SignInPage />} />
					<Route path="/admin" element={<AdminPanel />} />
					<Route
						path="/admin/participations"
						element={<AdminParticipations />}
					/>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</main>
			{!isAuthPage && <Footer />}
		</div>
	)
}

export default App
