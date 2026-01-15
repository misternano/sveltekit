import { derived, get, type Readable, writable } from "svelte/store";

export type GameStatus = "ready" | "playing" | "won" | "lost";

export type DifficultyKey = "beginner" | "intermediate" | "expert" | "custom";

export type Difficulty = {
	key: DifficultyKey;
	label: string;
	rows: number;
	cols: number;
	mines: number;
};

export type Cell = {
	row: number;
	col: number;
	mine: boolean;
	adj: number;
	revealed: boolean;
	flagged: boolean;
};

export type GameState = {
	difficulty: Difficulty;
	status: GameStatus;
	generated: boolean;
	grid: Cell[][];
	flags: number;
	revealedSafe: number;
	startedAtMs: number | null;
	elapsedMs: number;
	lastActionAtMs: number;
};

export const DIFFICULTIES: Record<Exclude<DifficultyKey, "custom">, Difficulty> = {
	beginner: { key: "beginner", label: "Beginner (9×9, 10)", rows: 9, cols: 9, mines: 10 },
	intermediate: { key: "intermediate", label: "Intermediate (16×16, 40)", rows: 16, cols: 16, mines: 40 },
	expert: { key: "expert", label: "Expert (16×30, 99)", rows: 16, cols: 30, mines: 99 }
};

export function clampCustomDifficulty(rows: number, cols: number, mines: number): Difficulty {
	const r = Math.max(5, Math.min(40, Math.floor(rows)));
	const c = Math.max(5, Math.min(60, Math.floor(cols)));
	const maxMines = Math.max(1, r * c - 9);
	const m = Math.max(1, Math.min(maxMines, Math.floor(mines)));
	return { key: "custom", label: `Custom (${r}×${c}, ${m})`, rows: r, cols: c, mines: m };
}

export function createInitialState(difficulty: Difficulty): GameState {
	const grid = createBlankGrid(difficulty.rows, difficulty.cols);
	return {
		difficulty,
		status: "ready",
		generated: false,
		grid,
		flags: 0,
		revealedSafe: 0,
		startedAtMs: null,
		elapsedMs: 0,
		lastActionAtMs: Date.now()
	};
}

export function createBlankGrid(rows: number, cols: number): Cell[][] {
	return Array.from({ length: rows }, (_, row) =>
		Array.from({ length: cols }, (_, col) => ({
			row,
			col,
			mine: false,
			adj: 0,
			revealed: false,
			flagged: false
		}))
	);
}

export function inBounds(grid: Cell[][], row: number, col: number): boolean {
	return row >= 0 && col >= 0 && row < grid.length && col < grid[0].length;
}

export function neighbors8(grid: Cell[][], row: number, col: number): Array<[number, number]> {
	const out: Array<[number, number]> = [];
	for (let dr = -1; dr <= 1; dr++) {
		for (let dc = -1; dc <= 1; dc++) {
			if (dr === 0 && dc === 0) continue;
			const r = row + dr;
			const c = col + dc;
			if (inBounds(grid, r, c)) out.push([r, c]);
		}
	}
	return out;
}

export function buildExcludedSet(grid: Cell[][], safeRow: number, safeCol: number, excludeNeighbors = true): Set<string> {
	const s = new Set<string>();
	s.add(`${safeRow},${safeCol}`);
	if (!excludeNeighbors) return s;
	for (const [r, c] of neighbors8(grid, safeRow, safeCol)) s.add(`${r},${c}`);
	return s;
}

export function placeMines(grid: Cell[][], mineCount: number, excluded: Set<string>): Cell[][] {
	const rows = grid.length;
	const cols = grid[0].length;
	const total = rows * cols;
	
	const candidates: number[] = [];
	for (let idx = 0; idx < total; idx++) {
		const r = Math.floor(idx / cols);
		const c = idx % cols;
		if (!excluded.has(`${r},${c}`)) candidates.push(idx);
	}
	
	const minesToPlace = Math.min(mineCount, candidates.length);
	shuffleInPlace(candidates);
	
	const next = cloneGrid(grid);
	for (let i = 0; i < minesToPlace; i++) {
		const idx = candidates[i];
		const r = Math.floor(idx / cols);
		const c = idx % cols;
		next[r][c].mine = true;
	}
	
	return computeAdjacencies(next);
}

export function computeAdjacencies(grid: Cell[][]): Cell[][] {
	const next = cloneGrid(grid);
	for (let r = 0; r < next.length; r++) {
		for (let c = 0; c < next[0].length; c++) {
			if (next[r][c].mine) {
				next[r][c].adj = 0;
				continue;
			}
			let count = 0;
			for (const [nr, nc] of neighbors8(next, r, c)) if (next[nr][nc].mine) count++;
			next[r][c].adj = count;
		}
	}
	return next;
}

export function toggleFlagAt(state: GameState, row: number, col: number): GameState {
	if (state.status === "won" || state.status === "lost") return state;
	if (!inBounds(state.grid, row, col)) return state;
	
	const cell = state.grid[row][col];
	if (cell.revealed) return state;
	
	const nextGrid = cloneGrid(state.grid);
	const nextCell = nextGrid[row][col];
	nextCell.flagged = !nextCell.flagged;
	
	const nextFlags = state.flags + (nextCell.flagged ? 1 : -1);
	
	return {
		...state,
		grid: nextGrid,
		flags: nextFlags,
		lastActionAtMs: Date.now()
	};
}

export function revealAt(state: GameState, row: number, col: number): GameState {
	if (state.status === "won" || state.status === "lost") return state;
	if (!inBounds(state.grid, row, col)) return state;
	
	const startCell = state.grid[row][col];
	if (startCell.flagged || startCell.revealed) return state;
	
	let nextState = state;
	
	// generation happens outside in the store; this function assumes grid is already generated if needed.
	
	const nextGrid = cloneGrid(nextState.grid);
	const cell = nextGrid[row][col];
	
	if (cell.mine) {
		cell.revealed = true;
		revealAllMines(nextGrid);
		return {
			...nextState,
			grid: nextGrid,
			status: "lost",
			lastActionAtMs: Date.now()
		};
	}
	
	const { revealedSafeDelta } = floodReveal(nextGrid, row, col);
	
	const afterReveal: GameState = {
		...nextState,
		grid: nextGrid,
		revealedSafe: nextState.revealedSafe + revealedSafeDelta,
		lastActionAtMs: Date.now()
	};
	
	return maybeWin(afterReveal);
}

export function chordAt(state: GameState, row: number, col: number): GameState {
	if (state.status !== "playing") return state;
	if (!inBounds(state.grid, row, col)) return state;
	
	const center = state.grid[row][col];
	if (!center.revealed || center.adj <= 0) return state;
	
	const nbrs = neighbors8(state.grid, row, col);
	let flagCount = 0;
	for (const [r, c] of nbrs) if (state.grid[r][c].flagged) flagCount++;
	
	if (flagCount !== center.adj) return state;
	
	let next = state;
	for (const [r, c] of nbrs) {
		const cell = next.grid[r][c];
		if (!cell.revealed && !cell.flagged) {
			next = revealAt(next, r, c);
			if (next.status === "lost") return next;
		}
	}
	return next;
}

export function revealAllMines(grid: Cell[][]): void {
	for (let r = 0; r < grid.length; r++) {
		for (let c = 0; c < grid[0].length; c++) {
			if (grid[r][c].mine) grid[r][c].revealed = true;
		}
	}
}

export function maybeWin(state: GameState): GameState {
	const { rows, cols, mines } = state.difficulty;
	const totalSafe = rows * cols - mines;
	if (state.revealedSafe >= totalSafe && state.status !== "lost") {
		const nextGrid = cloneGrid(state.grid);
		// Auto-flag remaining mines (nice UX)
		for (let r = 0; r < nextGrid.length; r++) {
			for (let c = 0; c < nextGrid[0].length; c++) {
				const cell = nextGrid[r][c];
				if (cell.mine) cell.flagged = true;
			}
		}
		return {
			...state,
			grid: nextGrid,
			status: "won",
			flags: mines,
			lastActionAtMs: Date.now()
		};
	}
	return state;
}

function floodReveal(grid: Cell[][], startR: number, startC: number): { revealedSafeDelta: number } {
	const q: Array<[number, number]> = [[startR, startC]];
	let revealedSafeDelta = 0;
	
	while (q.length) {
		const [r, c] = q.shift()!;
		const cell = grid[r][c];
		if (cell.revealed || cell.flagged) continue;
		if (cell.mine) continue;
		
		cell.revealed = true;
		revealedSafeDelta++;
		
		if (cell.adj === 0) {
			for (const [nr, nc] of neighbors8(grid, r, c)) {
				const n = grid[nr][nc];
				if (!n.revealed && !n.flagged && !n.mine) q.push([nr, nc]);
			}
		}
	}
	
	return { revealedSafeDelta };
}

function cloneGrid(grid: Cell[][]): Cell[][] {
	return grid.map((row) => row.map((c) => ({ ...c })));
}

function shuffleInPlace<T>(arr: T[]): void {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
}

type MinesweeperStore = Readable<GameState> & {
	newGame: (difficultyKey?: DifficultyKey, custom?: { rows: number; cols: number; mines: number }) => void;
	reset: () => void;
	reveal: (row: number, col: number) => void;
	flag: (row: number, col: number) => void;
	chord: (row: number, col: number) => void;
	setCustom: (rows: number, cols: number, mines: number) => void;
};

function difficultyFromKey(key: DifficultyKey, custom?: { rows: number; cols: number; mines: number }): Difficulty {
	if (key === "custom") {
		const cfg = custom ?? { rows: 16, cols: 16, mines: 40 };
		return clampCustomDifficulty(cfg.rows, cfg.cols, cfg.mines);
	}
	return DIFFICULTIES[key];
}

export function createMinesweeperStore(): MinesweeperStore {
	const initial = createInitialState(DIFFICULTIES.beginner);
	const { subscribe, set, update } = writable<GameState>(initial);
	
	let timerId: number | null = null;
	
	const stopTimer = () => {
		if (timerId != null) {
			clearInterval(timerId);
			timerId = null;
		}
	};
	
	const startTimerIfNeeded = () => {
		if (timerId != null) return;
		timerId = window.setInterval(() => {
			update((s) => {
				if (s.status !== "playing" || s.startedAtMs == null) return s;
				return { ...s, elapsedMs: Date.now() - s.startedAtMs };
			});
		}, 250);
	};
	
	const beginPlaying = () => {
		update((s) => {
			if (s.status === "playing") return s;
			const now = Date.now();
			return {
				...s,
				status: "playing",
				startedAtMs: s.startedAtMs ?? now,
				elapsedMs: s.startedAtMs ? s.elapsedMs : 0,
				lastActionAtMs: now
			};
		});
		startTimerIfNeeded();
	};
	
	const newGame = (difficultyKey: DifficultyKey = "beginner", custom?: { rows: number; cols: number; mines: number }) => {
		stopTimer();
		const diff = difficultyFromKey(difficultyKey, custom);
		set(createInitialState(diff));
	};
	
	const reset = () => {
		const s = get({ subscribe });
		newGame(s.difficulty.key, s.difficulty.key === "custom" ? s.difficulty : undefined);
	};
	
	const setCustom = (rows: number, cols: number, mines: number) => {
		newGame("custom", { rows, cols, mines });
	};
	
	const reveal = (row: number, col: number) => {
		update((s) => {
			if (s.status === "won" || s.status === "lost") return s;
			
			let next = s;
			
			if (!next.generated) {
				const excluded = buildExcludedSet(next.grid, row, col, true);
				const seededGrid = placeMines(next.grid, next.difficulty.mines, excluded);
				next = { ...next, grid: seededGrid, generated: true };
				const now = Date.now();
				next = { ...next, status: "playing", startedAtMs: now, elapsedMs: 0, lastActionAtMs: now };
			} else if (next.status === "ready") {
				next = { ...next, status: "playing", startedAtMs: Date.now(), elapsedMs: 0, lastActionAtMs: Date.now() };
			}
			
			next = revealAt(next, row, col);
			
			if (next.status === "won" || next.status === "lost") stopTimer();
			return next;
		});
		
		const s2 = get({ subscribe });
		if (s2.status === "playing") startTimerIfNeeded();
	};
	
	const flag = (row: number, col: number) => {
		update((s) => toggleFlagAt(s, row, col));
	};
	
	const chord = (row: number, col: number) => {
		update((s) => {
			const next = chordAt(s, row, col);
			if (next.status === "won" || next.status === "lost") stopTimer();
			return next;
		});
	};
	
	return { subscribe, newGame, reset, reveal, flag, chord, setCustom };
}

export const minesweeper = createMinesweeperStore();

export const minesLeft = derived(minesweeper, (s) => Math.max(0, s.difficulty.mines - s.flags));
export const elapsedSeconds = derived(minesweeper, (s) => Math.floor(s.elapsedMs / 1000));
