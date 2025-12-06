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

type NumGrid = number[][]

function createEmptyGrid(): NumGrid {
	return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function shuffle<T>(array: T[]): T[] {
	const a = [...array]
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		const tmp = a[i]
		a[i] = a[j]
		a[j] = tmp
	}
	return a
}

function isSafe(grid: NumGrid, row: number, col: number, num: number): boolean {
	for (let i = 0; i < SIZE; i++) {
		if (grid[row][i] === num) return false
		if (grid[i][col] === num) return false
	}
	
	const boxRow = Math.floor(row / 3) * 3
	const boxCol = Math.floor(col / 3) * 3
	
	for (let r = boxRow; r < boxRow + 3; r++) {
		for (let c = boxCol; c < boxCol + 3; c++) {
			if (grid[r][c] === num) return false
		}
	}
	
	return true
}

function findEmpty(grid: NumGrid): [number, number] | null {
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (grid[r][c] === 0) return [r, c]
		}
	}
	return null
}

function fillGrid(grid: NumGrid): boolean {
	const pos = findEmpty(grid)
	if (!pos) return true
	
	const [row, col] = pos
	const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
	
	for (const num of nums) {
		if (isSafe(grid, row, col, num)) {
			grid[row][col] = num
			if (fillGrid(grid)) return true
			grid[row][col] = 0
		}
	}
	
	return false
}

function generateSolvedGrid(): NumGrid {
	const grid = createEmptyGrid()
	fillGrid(grid)
	return grid
}

function cloneGrid(grid: NumGrid): NumGrid {
	return grid.map((row) => [...row])
}

function makePuzzleFromSolution(solution: NumGrid, holes: number): NumGrid {
	const grid = cloneGrid(solution)
	let removed = 0
	
	while (removed < holes) {
		const r = Math.floor(Math.random() * SIZE)
		const c = Math.floor(Math.random() * SIZE)
		
		if (grid[r][c] !== 0) {
			grid[r][c] = 0
			removed++
		}
	}
	
	return grid
}

export function generatePuzzleBoard(holes = 81-16): Board {
	const solved = generateSolvedGrid()
	const puzzle = makePuzzleFromSolution(solved, holes)
	
	return Array.from({ length: SIZE }, (_, r) =>
		Array.from({ length: SIZE }, (_, c) => {
			const v = puzzle[r][c]
			const value = v === 0 ? null : v
			return {
				value,
				notes: [],
				fixed: value !== null
			}
		})
	)
}
