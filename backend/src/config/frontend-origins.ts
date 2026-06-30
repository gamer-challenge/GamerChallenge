const defaultFrontendOrigins = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://46.202.171.145:5173",
	"http://ypocsd8on8dv0gn09tpoyyzw.46.202.171.145.sslip.io",
]

function getConfiguredFrontendOrigins() {
	return [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
		.flatMap((value) => value?.split(",") ?? [])
		.map((origin) => origin.trim())
		.filter(Boolean)
}

export function isAllowedFrontendOrigin(origin: string) {
	const allowedFrontendOrigins = new Set([
		...defaultFrontendOrigins,
		...getConfiguredFrontendOrigins(),
	])

	if (allowedFrontendOrigins.has(origin)) {
		return true
	}

	try {
		const url = new URL(origin)

		return (
			["http:", "https:"].includes(url.protocol) &&
			url.hostname.endsWith(".46.202.171.145.sslip.io")
		)
	} catch {
		return false
	}
}
