<script lang="ts">
	import { Bomb } from "lucide-svelte";
	import { Board, GameHeader } from "./components";
	import { minesweeper } from "./lib/util";
	import { onDestroy, onMount } from "svelte";
	import { browser } from "$app/environment";

	onMount(() => {
		debug = readDebug();
		debugTimer = window.setInterval(() => {
			const next = readDebug();
			if (next !== debug) debug = next;
		}, 1000);
		console.info(`%c> Mounted`, "background-color:#1c68d4;color:white;padding:4rem;padding-block:0.5rem;width:100%;");
	})

	const onReveal = (r: number, c: number) => minesweeper.reveal(r, c);
	const onFlag = (r: number, c: number) => minesweeper.flag(r, c);
	const onChord = (r: number, c: number) => minesweeper.chord(r, c);

	const reset = () => minesweeper.reset();

	// Handling debug menu
	let debug = false
	let debugTimer: number | null = null

	const readDebug = () => {
		if (!browser) return false;
		return (
			localStorage.getItem("minesweeper:debug") === "1" ||
			localStorage.getItem("arcade:debug") === "1"
		);
	}

	let hovered: { r: number, c: number } | null = null;
	const onHover = (r: number, c: number) => (hovered = { r, c });
	const onLeave = () => (hovered = null)

	$: hoveredCell =
		hovered && $minesweeper.grid[hovered.r] && $minesweeper.grid[hovered.r][hovered.c]
			? $minesweeper.grid[hovered.r][hovered.c]
			: null;

	$: hoveredLabel = (() => {
		if (!hoveredCell) return "-";
		if (hoveredCell.mine) return "bomb";
		if (hoveredCell.adj > 0) return `empty (${hoveredCell.adj})`;
		return "empty";
	})();

	onDestroy(() => {
		if (debugTimer != null) window.clearInterval(debugTimer);
	});
</script>

{#if debug}
	<div class="sticky top-16 z-50">
		<div class="absolute right-3 top-0 w-1/6 text-xs text-white/70 border border-white/10 bg-white/5 rounded-lg p-3 space-y-1">
			<div class="flex justify-between">
				<span>Minesweeper Debug Menu</span>
				<span class="text-yellow-100">status: {$minesweeper.status}</span>
			</div>
			<br />
			<div class="flex justify-between">
				<span class="text-yellow-100">cell:</span>
				<span>{hoveredLabel}</span>
			</div>
			<br />
			<button
				type="button"
				on:click={reset}
				class="px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
			>
				Reset
			</button>
		</div>
	</div>
{/if}

<header class="relative mt-32 md:mt-0">
	<h1 class="flex flex-row items-baseline w-fit mx-auto font-impact font-medium text-4xl text-center my-16">
		<span class="bg-gradient-to-b from-blue-500 to-white bg-clip-text text-transparent">Mine</span>
		<Bomb size={20} class="fill-slate-900 stroke-white" />
		<span class="bg-gradient-to-b from-blue-500 to-white bg-clip-text text-transparent">sweeper</span>
	</h1>
	{#if $minesweeper.status === "won" || $minesweeper.status === "lost"}
		<div
			class="-z-10 absolute -top-1/2 md:-translate-y-1/4 w-full text-center font-medium bg-gradient-to-b from-emerald-500/75 to-neutral-900 bg-clip-text text-transparent"
		>
			<h2 class="text-7xl md:text-9xl font-impact">{$minesweeper.status === "won" ? "WINNER" : "GAME OVER"}</h2>
		</div>
	{/if}
</header>

<main class="flex items-center justify-center">
	<div class="w-fit flex flex-col items-center justify-center gap-6">
		<GameHeader />

		<div class="relative">
			<Board
				grid={$minesweeper.grid}
				status={$minesweeper.status}
				{onReveal}
				{onFlag}
				{onChord}
				{onHover}
				{onLeave}
			/>

			{#if $minesweeper.status === "won" || $minesweeper.status === "lost"}
				<div class="absolute inset-0 flex items-center justify-center">
					<div class="absolute inset-0 bg-black/50 rounded-xl"></div>
					<div class="relative z-10 w-[min(28rem,90vw)] rounded-xl bg-neutral-950/80 ring-1 ring-neutral-700 p-6 text-center">
						<div class="font-impact text-4xl">
							{$minesweeper.status === "won" ? "YOU WIN" : "BOOM"}
						</div>
						<p class="mt-2 text-neutral-300">
							{$minesweeper.status === "won" ? "Clean sweep. No guesses needed." : "That one was armed."}
						</p>
						<div class="mt-5 flex items-center justify-center gap-3">
							<button
								type="button"
								on:click={reset}
								class="flex flex-row items-center gap-2 px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
							>
								Play again
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</main>
