import { createContext } from "react"
import type { User } from "../types/user"

export type AuthContextType = {
	user: User | null
	loading: boolean
	refreshUser: () => Promise<User | null>
	signIn: (provider: "google" | "twitch") => void
	signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)
