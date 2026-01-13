<script lang="ts">
	import { SIZE, generatePuzzleBoard } from "./lib/util"
	import type { Board } from "./lib/util"
	import { Selector } from "./components";
	import { onMount } from "svelte";

	onMount(() => {
		console.info(`%c> Mounted`, "background-color:#1c68d4;color:white;padding:4rem;padding-block:0.5rem");
	})

	let board: Board = generatePuzzleBoard()
	let selectedRow: number | null = null
	let selectedCol: number | null = null
	let noteMode = false
	let conflictSet: Set<string> = new Set()
	let hasWon = false

	const cellKey = (r: number, c: number) => {
		return `${r}-${c}`
	}

	const computeConflicts = (b: Board): Set<string> => {
		const conflicts = new Set<string>()

		for (let r = 0; r < SIZE; r++) {
			const seen: Record<number, [number, number][]> = {}
			for (let c = 0; c < SIZE; c++) {
				const v = b[r][c].value
				if (v === null) continue
				if (!seen[v]) seen[v] = []
				seen[v].push([r, c])
			}
			for (const v in seen) {
				if (seen[v].length > 1) {
					for (const [rr, cc] of seen[v]) {
						conflicts.add(cellKey(rr, cc))
					}
				}
			}
		}

		for (let c = 0; c < SIZE; c++) {
			const seen: Record<number, [number, number][]> = {}
			for (let r = 0; r < SIZE; r++) {
				const v = b[r][c].value
				if (v === null) continue
				if (!seen[v]) seen[v] = []
				seen[v].push([r, c])
			}
			for (const v in seen) {
				if (seen[v].length > 1) {
					for (const [rr, cc] of seen[v]) {
						conflicts.add(cellKey(rr, cc))
					}
				}
			}
		}

		for (let br = 0; br < 3; br++) {
			for (let bc = 0; bc < 3; bc++) {
				const seen: Record<number, [number, number][]> = {}
				const startR = br * 3
				const startC = bc * 3
				for (let r = startR; r < startR + 3; r++) {
					for (let c = startC; c < startC + 3; c++) {
						const v = b[r][c].value
						if (v === null) continue
						if (!seen[v]) seen[v] = []
						seen[v].push([r, c])
					}
				}
				for (const v in seen) {
					if (seen[v].length > 1) {
						for (const [rr, cc] of seen[v]) {
							conflicts.add(cellKey(rr, cc))
						}
					}
				}
			}
		}

		return conflicts
	}

	const isBoardComplete = (b: Board) => {
		for (let r = 0; r < SIZE; r++) {
			for (let c = 0; c < SIZE; c++) {
				if (b[r][c].value === null) return false
			}
		}
		return true
	}

	const clearSelection = () => {
		selectedRow = null
		selectedCol = null
	}

	const newGame = () => {
		clearSelection()
		board = generatePuzzleBoard()
		selectedRow = null
		selectedCol = null
		noteMode = false
		hasWon = false
	}

	$: conflictSet = computeConflicts(board)
	$: hasWon = isBoardComplete(board) && conflictSet.size === 0

	const selectCell = (r: number, c: number) => {
		if (board[r][c].fixed) return
		selectedRow = r
		selectedCol = c
	}

	const updateCell = (r: number, c: number, updater: (cell: Board[0][0]) => Board[0][0]) => {
		board = board.map((row, ri) =>
			row.map((cell, ci) => (ri === r && ci === c ? updater(cell) : cell))
		)
	}

	const handleDigitInput = (d: number) => {
		if (selectedRow === null || selectedCol === null) return
		const r = selectedRow
		const c = selectedCol
		const cell = board[r][c]
		if (cell.fixed) return

		if (noteMode) {
			const has = cell.notes.includes(d)
			const notes = has ? cell.notes.filter((n) => n !== d) : [...cell.notes, d].sort()
			updateCell(r, c, (old) => ({ ...old, notes }))
		} else {
			const value = cell.value === d ? null : d
			updateCell(r, c, (old) => ({ ...old, value, notes: [] }))
		}
	}

	const clearCell = () => {
		if (selectedRow === null || selectedCol === null) return
		const r = selectedRow
		const c = selectedCol
		const cell = board[r][c]
		if (cell.fixed) return
		updateCell(r, c, (old) => ({ ...old, value: null, notes: [] }))
	}

	const handleArrow = (key: string) => {
		if (selectedRow === null || selectedCol === null) {
			selectedRow = 0
			selectedCol = 0
			return
		}
		let r = selectedRow
		let c = selectedCol
		if (key === "ArrowUp") r = (r + SIZE - 1) % SIZE
		if (key === "ArrowDown") r = (r + 1) % SIZE
		if (key === "ArrowLeft") c = (c + SIZE - 1) % SIZE
		if (key === "ArrowRight") c = (c + 1) % SIZE
		selectedRow = r
		selectedCol = c
	}

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === " ") {
			e.preventDefault()
			noteMode = !noteMode
			return
		}

		if (e.key === "Backspace" || e.key === "Delete") {
			e.preventDefault()
			clearCell()
			return
		}

		if (e.key.startsWith("Arrow")) {
			e.preventDefault()
			handleArrow(e.key)
			return
		}

		const num = parseInt(e.key, 10)
		if (num >= 1 && num <= 9) {
			e.preventDefault()
			handleDigitInput(num)
		}
	}

	const handleNumberButtonClick = (d: number) => {
		handleDigitInput(d)
	}

	type Letter = {
		ch: string;
		scale: number;
		rotate?: number;
	}

	const title: Letter[] = [
		{ ch: "s", scale: 1 },
		{ ch: "u", scale: 1.07 },
		{ ch: "d", scale: 1.11 },
		{ ch: "o", scale: 1.16 },
		{ ch: "k", scale: 1.10 },
		{ ch: "u", scale: 1.01 },
		{ ch: "!", scale: 0.97, rotate: 3 }
	]
</script>

<svelte:window on:keydown={handleKeydown} />

<header class="relative">
	<h1 class="w-fit mx-auto font-impact font-medium text-4xl text-center my-16">
		{#each title as l}
		<span
			class="inline-block bg-gradient-to-b from-indigo-300 to-indigo-500 bg-clip-text text-transparent will-change-transform tracking-wide"
			style={`transform: translateZ(0) scale(${l.scale}) rotate(${l.rotate ? l.rotate+"deg" : 0});`}
		>
			{l.ch}
		</span>
		{/each}
	</h1>
	{#if hasWon}
		<div class="-z-10 absolute -top-1/2 -translate-y-1/4 w-full text-center font-medium bg-gradient-to-b from-emerald-500/75 to-neutral-900 bg-clip-text text-transparent">
			<h2 class="text-9xl font-impact">
				VICTORY
			</h2>
		</div>
	{/if}
</header>

<div class="flex flex-col items-center gap-6 cursor-pointer" role="button" tabindex="0" on:click={clearSelection} on:keydown={(e) => (e.key === "Escape" || e.key === "Enter") && clearSelection()}>
	<div class="max-w-[90vw] w-[90vw] aspect-square md:w-auto md:max-w-none rounded-xl overflow-hidden border border-white">
		<div class="board grid grid-cols-9 gap-0.5">
			{#if hasWon}
				<div class="absolute inset-0 bg-black/10 z-20 backdrop-blur-sm">
					<div class="h-full flex justify-center items-center">
						<button
							class="p-1 px-8 bg-indigo-500 hover:ring ring-indigo-300 text-white text-lg font-anton rounded-md active:scale-95 transition-all"
							on:click={newGame}
						>
							Play Again
						</button>
					</div>
				</div>
			{/if}
			{#each board as row, r}
				{#each row as cell, c}
					<button
						type="button"
						class={`cell relative h-full w-auto aspect-square md:h-16 md:w-16 flex items-center justify-center text-black text-xl md:text-3xl font-medium border border-neutral-300 group focus:outline-none focus:ring-0 focus-visible:ring-0
						${conflictSet.has(cellKey(r, c))
							? "bg-red-300"
							: cell.fixed
							? "bg-neutral-400/90"
							: "bg-neutral-400"}`}
						on:click|stopPropagation={() => selectCell(r, c)}
						disabled={cell.fixed}
					>
						{#if !cell.fixed}
							<div
								class={`pointer-events-none absolute inset-[3px] rounded-md
								${selectedRow === r && selectedCol === c
									? "bg-slate-500/80 border border-slate-800/50 shadow-lg"
									: "group-hover:bg-slate-500/50 group-hover:shadow-lg group-hover:border group-hover:border-slate-800/50 group-hover:animate-pulse group-focus-visible:bg-slate-500/50 group-focus-visible:shadow-lg group-focus-visible:border group-focus-visible:border-slate-800/50"}`}
							/>
						{/if}

						{#if cell.value !== null}
							<span class="relative z-10">{cell.value}</span>
						{:else if cell.notes.length > 0}
							<div class="relative z-10 grid grid-cols-3 gap-[1px] text-[0.55rem] leading-none">
								{#each Array(9) as _, i}
								<span class="h-3 w-3 text-center font-bold">
									{cell.notes.includes(i + 1) ? i + 1 : ""}
								</span>
								{/each}
							</div>
						{/if}
					</button>

				{/each}
			{/each}
		</div>
	</div>
</div>

<Selector noteMode={noteMode} toggleNoteMode={() => noteMode = !noteMode} onNumberSelect={handleNumberButtonClick} />
<style>
	:global(body) {
		@apply bg-neutral-900 text-[#cccccc];
	}

	.board {
		position: relative;
		isolation: isolate;

		--gap: 0.125rem; /* tailwind gap-0.5 */
		--thick-line: rgba(255, 255, 255, 0.75);
	}

	.board::before {
		content: "";
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 5;

		--cell: calc((100% - (8 * var(--gap))) / 9);
		--x1: calc((3 * var(--cell)) + (2 * var(--gap)));
		--x2: calc((6 * var(--cell)) + (5 * var(--gap)));
		--y1: calc((3 * var(--cell)) + (2 * var(--gap)));
		--y2: calc((6 * var(--cell)) + (5 * var(--gap)));

		background:
			/* vertical */
			linear-gradient(to right,
			transparent 0,
			transparent var(--x1),
			var(--thick-line) var(--x1),
			var(--thick-line) calc(var(--x1) + var(--gap)),
			transparent calc(var(--x1) + var(--gap))
			),
			linear-gradient(to right,
			transparent 0,
			transparent var(--x2),
			var(--thick-line) var(--x2),
			var(--thick-line) calc(var(--x2) + var(--gap)),
			transparent calc(var(--x2) + var(--gap))
			),
			/* horizontal */
			linear-gradient(to bottom,
			transparent 0,
			transparent var(--y1),
			var(--thick-line) var(--y1),
			var(--thick-line) calc(var(--y1) + var(--gap)),
			transparent calc(var(--y1) + var(--gap))
			),
			linear-gradient(to bottom,
			transparent 0,
			transparent var(--y2),
			var(--thick-line) var(--y2),
			var(--thick-line) calc(var(--y2) + var(--gap)),
			transparent calc(var(--y2) + var(--gap))
			);
	}
</style>
