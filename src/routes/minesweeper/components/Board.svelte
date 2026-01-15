<script lang="ts">
	import type { Cell } from "../lib/util";
	import CellButton from "./CellButton.svelte";

	export let grid: Cell[][];
	export let status: "ready" | "playing" | "won" | "lost";
	export let onReveal: (r: number, c: number) => void;
	export let onFlag: (r: number, c: number) => void;
	export let onChord: (r: number, c: number) => void;

	export let onHover: ((r: number, c: number) => void) | undefined = undefined;
	export let onLeave: (() => void) | undefined = undefined;
</script>

<div class="overflow-auto max-w-full">
	<div
		class="grid gap-1 p-2 rounded-xl bg-neutral-950/40 ring-1 ring-neutral-800 w-fit mx-auto"
		style={`grid-template-columns: repeat(${grid[0]?.length ?? 0}, minmax(0, 1fr));`}
	>
		{#each grid as row, r}
			{#each row as cell, c (cell.row * 1000 + cell.col)}
				<CellButton
					{cell}
					{status}
					onReveal={() => onReveal(r, c)}
					onFlag={() => onFlag(r, c)}
					onChord={() => onChord(r, c)}
					onHover={() => onHover?.(r, c)}
					onLeave={() => onLeave?.()}
				/>
			{/each}
		{/each}
	</div>
</div>
