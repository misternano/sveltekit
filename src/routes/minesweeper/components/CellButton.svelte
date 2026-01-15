<script lang="ts">
	import type { Cell } from "../lib/util";

	export let cell: Cell;
	export let status: "ready" | "playing" | "won" | "lost";
	export let onReveal: () => void;
	export let onFlag: () => void;
	export let onChord: () => void;

	export let onHover: (() => void) | undefined = undefined;
	export let onLeave: (() => void) | undefined = undefined;

	const numberClass = (n: number) => {
		switch (n) {
			case 1: return "text-blue-500";
			case 2: return "text-emerald-500";
			case 3: return "text-red-500";
			case 4: return "text-indigo-500";
			case 5: return "text-amber-600";
			case 6: return "text-cyan-500";
			case 7: return "text-fuchsia-500";
			case 8: return "text-neutral-600";
			default: return "text-neutral-700";
		}
	};

	const handleClick = () => {
		if (cell.revealed) {
			onChord();
			return;
		}
		onReveal();
	};

	const handleContextMenu = (e: MouseEvent) => {
		e.preventDefault();
		onFlag();
	};
</script>

<button
	type="button"
	aria-label={`Cell ${cell.row + 1}, ${cell.col + 1}`}
	on:click={handleClick}
	on:contextmenu={handleContextMenu}
	on:mouseenter={() => onHover?.()}
	on:mouseleave={() => onLeave?.()}
	class={[
		"select-none flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md border border-white/10",
		cell.revealed
			? "bg-neutral-900/60"
			: "bg-white/5 hover:border-white/25 active:scale-[0.98]",
		status === "lost" && cell.mine ? "bg-red-900/60 ring-red-700" : ""
	].join(" ")}
	disabled={status === "won" || status === "lost"}
>
	{#if cell.revealed}
		{#if cell.mine}
			<span class="text-lg">💣</span>
		{:else if cell.adj > 0}
			<span class={["font-impact text-xl leading-none", numberClass(cell.adj)].join(" ")}>{cell.adj}</span>
		{:else}
			<span class="opacity-0">0</span>
		{/if}
	{:else}
		{#if cell.flagged}
			<span class="text-lg">🚩</span>
		{:else}
			<span class="opacity-0">.</span>
		{/if}
	{/if}
</button>
