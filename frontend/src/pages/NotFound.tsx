import { Link } from "react-router"
import notFoundGif from "../assets/my-honest-reaction.gif"
import Button from "../components/reusable/Button"

export default function NotFound() {
	return (
		<div className="mx-auto grid min-h-[calc(100svh-72px)] w-full max-w-container-max grid-cols-1 items-center gap-xl px-md py-xl md:px-xl lg:grid-cols-2">
			<section className="glass-panel-strong rounded-xl p-lg md:p-xl">
				<p className="font-caption text-caption uppercase tracking-[0.05em] text-error">
					{"404 // route missing"}
				</p>
				<h1 className="mt-sm font-h1 text-h1-mobile text-on-surface md:text-h1">
					Page Not Found
				</h1>
				<p className="mt-md text-on-surface-variant">
					This page does not exist or the challenge has moved out of the active
					arena.
				</p>
				<div className="mt-lg flex flex-col gap-md sm:flex-row">
					<Link to="/">
						<Button className="w-full sm:w-auto">Back Home</Button>
					</Link>
					<Link to="/challenges">
						<Button variant="secondary" className="w-full sm:w-auto">
							Browse Challenges
						</Button>
					</Link>
				</div>
			</section>
			<div className="glass-panel overflow-hidden rounded-xl">
				<img
					src={notFoundGif}
					alt="404"
					className="aspect-video h-full w-full object-cover"
				/>
			</div>
		</div>
	)
}
