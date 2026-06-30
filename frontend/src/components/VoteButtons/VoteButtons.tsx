import { useState } from "react"
import { api } from "../../lib/api"

type VoteButtonsProps = {
	participationId: number
	initialUpvotes: number
	initialDownvotes: number
	userVote: 1 | -1 | null
}

export default function VoteButtons({
	participationId,
	initialUpvotes,
	initialDownvotes,
	userVote,
}: VoteButtonsProps) {
	const [upvotes, setUpvotes] = useState(initialUpvotes)
	const [downvotes, setDownvotes] = useState(initialDownvotes)
	const [currentUserVote, setCurrentUserVote] = useState<1 | -1 | null>(
		userVote,
	)

	const handleVote = async (value: 1 | -1) => {
		const previousUpvotes = upvotes
		const previousDownvotes = downvotes
		const previousVote = currentUserVote

		if (currentUserVote === value) {
			setCurrentUserVote(null)
			if (value === 1) setUpvotes(upvotes - 1)
			else setDownvotes(downvotes - 1)
		} else if (currentUserVote !== null) {
			setCurrentUserVote(value)
			if (value === 1) {
				setUpvotes(upvotes + 1)
				setDownvotes(downvotes - 1)
			} else {
				setUpvotes(upvotes - 1)
				setDownvotes(downvotes + 1)
			}
		} else {
			setCurrentUserVote(value)
			if (value === 1) setUpvotes(upvotes + 1)
			else setDownvotes(downvotes + 1)
		}

		try {
			const res = await api.vote(participationId, value)
			if (!res.ok) throw new Error(`Vote failed: ${res.status}`)

			const data = await res.json()
			setUpvotes(data.upvotes)
			setDownvotes(data.downvotes)
		} catch (error) {
			console.error("Vote failed, rolling back:", error)
			setUpvotes(previousUpvotes)
			setDownvotes(previousDownvotes)
			setCurrentUserVote(previousVote)
		}
	}

	return (
		<div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-surface-container px-2 py-1">
			<button
				type="button"
				onClick={() => handleVote(1)}
				aria-label="Upvote"
				aria-pressed={currentUserVote === 1}
				className={`flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:text-tertiary ${
					currentUserVote === 1 ? "text-tertiary" : "text-on-surface-variant"
				}`}
			>
				<span className="material-symbols-outlined text-[18px]">
					arrow_upward
				</span>
				<span className="text-sm font-semibold">{upvotes}</span>
			</button>
			<div className="h-5 w-px bg-white/10" />
			<button
				type="button"
				onClick={() => handleVote(-1)}
				aria-label="Downvote"
				aria-pressed={currentUserVote === -1}
				className={`flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:text-error ${
					currentUserVote === -1 ? "text-error" : "text-on-surface-variant"
				}`}
			>
				<span className="material-symbols-outlined text-[18px]">
					arrow_downward
				</span>
				<span className="text-sm font-semibold">{downvotes}</span>
			</button>
		</div>
	)
}
