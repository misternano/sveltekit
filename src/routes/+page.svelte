<script lang="ts">
	import "../app.css";
	import { onMount } from "svelte"
	import { Sparkles, Clock, RotateCcw } from "lucide-svelte"
	import { goto } from "$app/navigation"
	import { lastGame } from "$lib/lastGame"
	import { GAMES, type GameMeta } from "$lib/game";

	let dailyGame: GameMeta = GAMES[0]

	const computeDailyGame = () => {
		const today = new Date()
		const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
		const index = seed % GAMES.length
		return GAMES[index]
	}

	onMount(() => {
		dailyGame = computeDailyGame()
	})
</script>

<main class="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
	<section class="flex flex-col items-center text-center gap-4 mb-12">
		<div class="flex items-center gap-3 text-indigo-300 uppercase tracking-[0.25em] text-xs">
			<Sparkles size="16" />
			<span>Black Jack released!</span>
			<Sparkles size="16" />
		</div>
		<h1 class="relative font-impact text-6xl sm:text-7xl md:text-8xl tracking-wide bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent">
			BKCLB Arcade
		</h1>
		<p class="text-neutral-400 max-w-xl text-sm sm:text-base">
			Minimal, fast arcade games with no ads, no tracking, and no distractions.
		</p>
	</section>
	<section class="w-full max-w-4xl flex flex-col gap-6">
		{#if $lastGame}
			<div class="flex flex-col md:flex-row gap-4 items-stretch">
				<button
					type="button"
					class="flex-1 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-600/30 via-emerald-500/10 to-neutral-900 px-6 py-5 text-left hover:-translate-y-1 hover:shadow-2xl transition-all focus:outline-none focus:ring-0"
					on:click={() => goto($lastGame.path)}
				>
					<span class="flex items-center gap-3 mb-2 text-emerald-300">
						<RotateCcw size="20" />
						<span class="uppercase text-xs tracking-[0.2em]">Resume</span>
					</span>
					<span class="text-xl font-semibold text-white">
						Continue {$lastGame.name}
					</span>
					<span class="mt-1 text-neutral-300 text-sm">
						Pick up right where you left off.
					</span>
				</button>
				<button
					type="button"
					class="md:w-64 rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-600/30 via-indigo-500/10 to-neutral-900 px-6 py-5 text-left hover:-translate-y-1 hover:shadow-2xl transition-all focus:outline-none focus:ring-0"
					on:click={() => goto(dailyGame.path)}
				>
					<span class="flex items-center gap-3 mb-2 text-indigo-300">
						<Clock size="20" />
						<span class="uppercase text-xs tracking-[0.2em]">Daily challenge</span>
					</span>
					<span class="text-lg font-semibold text-white">
						{dailyGame.name}
					</span>
					<span class="mt-1 text-neutral-300 text-sm">
						{dailyGame.tagline}
					</span>
				</button>
			</div>
		{:else}
			<div class="flex flex-col md:flex-row gap-4 items-stretch">
				<button
					type="button"
					class="flex-1 rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-600/30 via-indigo-500/10 to-neutral-900 px-6 py-5 text-left hover:-translate-y-1 hover:shadow-2xl transition-all focus:outline-none focus:ring-0"
					on:click={() => goto(dailyGame.path)}
				>
					<span class="flex items-center gap-3 mb-2 text-indigo-300">
						<Clock size="20" />
						<span class="uppercase text-xs tracking-[0.2em]">Daily challenge</span>
					</span>
					<span class="text-xl font-semibold text-white">
						{dailyGame.name}
					</span>
					<span class="mt-1 text-neutral-300 text-sm">
						{dailyGame.tagline}
					</span>
				</button>
			</div>
		{/if}
		<p class="mx-auto text-neutral-500 text-xs sm:text-sm uppercase tracking-[0.3em] animate-pulse">
			Or pick a game from the top bar
		</p>
		<div class="mt-8 text-center text-neutral-600 text-xs sm:text-sm">
			<p>No accounts. No leaderboards. Just arcade games that load instantly.</p>
		</div>
	</section>
</main>

<footer class="pb-6 text-center text-neutral-700 text-xs">
	BKCLB Arcade · Built for quiet, focused play
</footer>
