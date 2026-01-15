<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { page } from "$app/stores";
	import { Grid2x2Check, LayoutGrid, Spade, Worm, Bomb } from "lucide-svelte";
	import { GAMES, type GameId, normalizePathname } from "$lib/game"

	const dispatch = createEventDispatcher<{ navigate: void }>();
	const onNavigate = () => dispatch("navigate");

	export let collapsed = false;

	$: pathname = normalizePathname($page.url.pathname);

	const iconMap: Record<GameId, typeof LayoutGrid> = {
		tictactoe: LayoutGrid,
		sudoku: Grid2x2Check,
		snake: Worm,
		blackjack: Spade,
		minesweeper: Bomb,
	};
</script>

{#each GAMES as g}
	{#if pathname === g.path}
		<a
			href={g.path}
			on:click={onNavigate}
			class="group inline-flex items-center gap-[0.55rem] px-[0.9rem] py-[0.55rem] rounded-full no-underline whitespace-nowrap select-none
			bg-gradient-to-b from-indigo-500/95 to-indigo-600/95 text-white
			shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),_0_22px_54px_rgba(0,0,0,0.65),_0_14px_34px_rgba(99,102,241,0.28)]
			transform-gpu transition-[transform,box-shadow,background-color,color] duration-150 ease-out
			hover:-translate-y-[1px]
			hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22),_0_26px_66px_rgba(0,0,0,0.70),_0_18px_44px_rgba(99,102,241,0.38)]
			active:translate-y-0 active:scale-[0.985]
			focus-visible:outline-none
			focus-visible:shadow-[inset_0_0_0_1px_rgba(99,102,241,0.55),_0_0_0_4px_rgba(99,102,241,0.25),_0_18px_44px_rgba(0,0,0,0.60)]"
			class:!justify-center={collapsed}
		>
			<svelte:component
				this={iconMap[g.slug]}
				size="16"
				class="opacity-95 text-white transition-[opacity,color,filter] duration-150 ease-out
				drop-shadow-[0_10px_22px_rgba(0,0,0,0.35)]"
			/>
			<span class="font-semibold tracking-[0.2px]">{g.name}</span>
		</a>
	{:else}
		<a
			href={g.path}
			on:click={onNavigate}
			class="group inline-flex items-center gap-[0.55rem] px-[0.9rem] py-[0.55rem] rounded-full no-underline whitespace-nowrap select-none
			text-slate-200 bg-slate-900/55 backdrop-blur-[12px]
			shadow-[inset_0_0_0_1px_rgba(99,102,241,0.28),_0_10px_26px_rgba(0,0,0,0.45)]
			transform-gpu transition-[transform,box-shadow,background-color,color] duration-150 ease-out
			hover:bg-slate-900/80 hover:-translate-y-[1px]
			hover:shadow-[inset_0_0_0_1px_rgba(99,102,241,0.45),_0_18px_44px_rgba(0,0,0,0.60),_0_0_0_1px_rgba(99,102,241,0.12)]
			active:translate-y-0 active:scale-[0.985]
			focus-visible:outline-none
			focus-visible:shadow-[inset_0_0_0_1px_rgba(99,102,241,0.55),_0_0_0_4px_rgba(99,102,241,0.25),_0_18px_44px_rgba(0,0,0,0.60)]"
			class:!justify-center={collapsed}
		>
			<svelte:component
				this={iconMap[g.slug]}
				size="16"
				class="opacity-95 text-indigo-300 transition-[opacity,color,filter] duration-150 ease-out
				drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]
				group-hover:opacity-100 group-hover:text-indigo-400
				group-hover:drop-shadow-[0_12px_26px_rgba(99,102,241,0.22)]"
			/>
			<span class="font-semibold tracking-[0.2px]">{g.name}</span>
		</a>
	{/if}
{/each}
