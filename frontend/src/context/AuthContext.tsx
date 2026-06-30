import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { api } from "../lib/api"
import type { User } from "../types/user"
import { AuthContext } from "./auth-core"

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	const refreshUser = useCallback(async () => {
		try {
			const response = await api.me()
			const data = response.ok ? ((await response.json()) as User) : null
			setUser(data)
			return data
		} catch {
			setUser(null)
			return null
		}
	}, [])

	useEffect(() => {
		refreshUser().finally(() => setLoading(false))
	}, [refreshUser])

	const signIn = (provider: "google" | "twitch") => {
		window.location.href = api.getAuthUrl(provider)
	}

	const signOut = async () => {
		await api.logout()
		setUser(null)
	}

	return (
		<AuthContext.Provider
			value={{ user, loading, refreshUser, signIn, signOut }}
		>
			{children}
		</AuthContext.Provider>
	)
}
