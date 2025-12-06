<script lang="ts">
	import { SIZE, createEmptyBoard } from './lib/util';
	import type { Board } from './lib/util';
	import { Pencil } from "lucide-svelte";

	let board: Board = createEmptyBoard()
	let selectedRow: number | null = null
	let selectedCol: number | null = null
	let noteMode = false

	function selectCell(r: number, c: number) {
		if (board[r][c].fixed) return
		selectedRow = r
		selectedCol = c
	}

	function updateCell(r: number, c: number, updater: (cell: Board[0][0]) => Board[0][0]) {
		board = board.map((row, ri) =>
			row.map((cell, ci) => (ri === r && ci === c ? updater(cell) : cell))
		)
	}

	function handleDigitInput(d: number) {
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

	function clearCell() {
		if (selectedRow === null || selectedCol === null) return
		const r = selectedRow
		const c = selectedCol
		const cell = board[r][c]
		if (cell.fixed) return
		updateCell(r, c, (old) => ({ ...old, value: null, notes: [] }))
	}

	function handleArrow(key: string) {
		if (selectedRow === null || selectedCol === null) {
			selectedRow = 0
			selectedCol = 0
			return
		}
		let r = selectedRow
		let c = selectedCol
		if (key === 'ArrowUp') r = (r + SIZE - 1) % SIZE
		if (key === 'ArrowDown') r = (r + 1) % SIZE
		if (key === 'ArrowLeft') c = (c + SIZE - 1) % SIZE
		if (key === 'ArrowRight') c = (c + 1) % SIZE
		selectedRow = r
		selectedCol = c
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === ' ') {
			e.preventDefault()
			noteMode = !noteMode
			return
		}

		if (e.key === 'Backspace' || e.key === 'Delete') {
			e.preventDefault()
			clearCell()
			return
		}

		if (e.key.startsWith('Arrow')) {
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

	function handleNumberButtonClick(d: number) {
		handleDigitInput(d)
	}

	function toggleNoteMode() {
		noteMode = !noteMode
	}
</script>

<div class="flex min-h-screen flex-col items-center gap-6 p-4" tabindex="0" on:keydown={handleKeydown} role="application">
	<h1 class="text-2xl font-semibold">Sudoku</h1>

	<div class="grid grid-cols-9 gap-[1px] bg-neutral-400">
		{#each board as row, r}
			{#each row as cell, c}
				<button
					type="button"
					class={`relative flex h-12 w-12 items-center justify-center bg-white text-lg
            border border-neutral-300
            ${r % 3 === 2 && r !== SIZE - 1 ? 'border-b-2 border-b-black' : ''}
            ${c % 3 === 2 && c !== SIZE - 1 ? 'border-r-2 border-r-black' : ''}
            ${selectedRow === r && selectedCol === c ? 'ring-2 ring-blue-500' : ''}
            ${cell.fixed ? 'bg-neutral-100 font-semibold' : ''}
          `}
					on:click={() => selectCell(r, c)}
				>
					{#if cell.value !== null}
						<span>{cell.value}</span>
					{:else if cell.notes.length > 0}
						<div class="grid grid-cols-3 gap-[1px] text-[0.55rem] leading-none">
							{#each Array(9) as _, i}
                <span class="h-3 w-3 text-center">
                  {cell.notes.includes(i + 1) ? i + 1 : ''}
                </span>
							{/each}
						</div>
					{/if}
				</button>
			{/each}
		{/each}
	</div>

	<div class="flex flex-wrap justify-center gap-2">
		{#each Array(9) as _, i}
			<button
				type="button"
				class="h-10 w-10 rounded-md border border-neutral-300 text-lg font-medium shadow-sm hover:bg-neutral-100"
				on:click={() => handleNumberButtonClick(i + 1)}
			>
				{i + 1}
			</button>
		{/each}
		<button type="button" class="h-10 w-10 flex justify-center items-center rounded-md border border-neutral-300 text-lg font-medium shadow-sm hover:bg-neutral-100" on:click={toggleNoteMode}> <Pencil size="16" /> </button>
	</div>
</div>
