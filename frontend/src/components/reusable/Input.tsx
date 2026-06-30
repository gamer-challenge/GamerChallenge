import type { ChangeEvent } from "react"

type InputProps = {
	name: string
	label?: string
	type?: "text" | "email" | "password" | "url" | "number"
	placeholder?: string
	value?: string | number
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void
	required?: boolean
	className?: string
}

export default function Input({
	name,
	label,
	type = "text",
	placeholder,
	value,
	onChange,
	required = false,
	className = "",
}: InputProps) {
	return (
		<div className={`flex w-full flex-col gap-2 ${className}`}>
			{label && (
				<label
					htmlFor={name}
					className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant"
				>
					{label}
				</label>
			)}
			<input
				id={name}
				name={name}
				type={type}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				required={required}
				className="tactical-input px-md py-sm"
			/>
		</div>
	)
}
