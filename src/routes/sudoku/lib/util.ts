export const SIZE = 9

export type Cell = {
	value: number | null
	notes: number[]
	fixed: boolean
}

export type Board = Cell[][]

export function createEmptyBoard(): Board {
	return Array.from({ length: SIZE }, () =>
		Array.from({ length: SIZE }, () => ({
			value: null,
			notes: [],
			fixed: false
		}))
	)
}
