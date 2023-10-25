<script lang="ts">
	import "../../app.css";
	import { Move, checkWinner, State } from "./util";
	import Icon from "./Icon.svelte";
	import EmptyCell from "./EmptyCell.svelte";
	import { tick } from "svelte";
	import { ChevronDown } from "lucide-svelte";

	const focusNextAvailableTile = () => {
		const nextTile = boardEl.querySelector("button:not(:disabled)");
		if (nextTile)
			(nextTile as HTMLElement).focus();
		else
			statusEl.focus();
	}

	const getEmptyBoard = () => {
		return [
			[Move.Empty, Move.Empty, Move.Empty] as Move[],
			[Move.Empty, Move.Empty, Move.Empty] as Move[],
			[Move.Empty, Move.Empty, Move.Empty] as Move[]
		];
	}

	const place = (row: number, col: number) => {
		board[row][col] = turn;
		turn = turn === Move.O ? Move.X : Move.O;
		tick().then(focusNextAvailableTile);
	}

	const reset = () => {
		board = getEmptyBoard();
		tick().then(focusNextAvailableTile);
	}

	const getGameState = (winner: Move | undefined, board: Move[][]) => {
		if (winner)
			return State.Won;
		else if (board.every((row) => row.every((col) => col !== Move.Empty)))
			return State.Draw;
		else
			return State.Playing;
	}

	let board: Move[][] = getEmptyBoard();
	let turn: Move = Move.O;
	let state: State = State.Playing;
	let boardEl: HTMLElement, statusEl: HTMLElement;

	$: winner = checkWinner(board);
	$: state = getGameState(winner, board);
</script>

<div class="relative">
	<h1 class="w-fit mx-auto font-impact font-medium text-4xl text-center my-16">
		Tic-Tac-Toe
	</h1>
	{#if state === State.Won}
		<div class="-z-10 absolute -top-1/2 -translate-y-1/4 w-full text-center font-medium bg-gradient-to-b from-emerald-500/75 to-[#171717] bg-clip-text text-transparent">
			<h2 class="text-9xl font-impact">
				{winner} WON
			</h2>
		</div>
	{/if}
</div>

<div class="grid lg:grid-cols-3">
	<div class="hidden lg:block justify-self-center my-auto relative">
		{#if state === State.Won}
			{#if winner === Move.X}
				<svg xmlns="http://www.w3.org/2000/svg" class="z-10 crown stroke-amber-500 absolute -top-6 left-2 -rotate-12" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
				</svg>
				<svg xmlns="http://www.w3.org/2000/svg" class="winner" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/>
					<path d="m6 6 12 12"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/>
					<path d="m6 6 12 12"/>
				</svg>
			{/if}
		{/if}
		{#if state === State.Playing}
			{#if turn === Move.X}
				<div class="absolute right-0 rotate-45">
					<ChevronDown size="50" class="animate-bounce" />
				</div>
				<svg xmlns="http://www.w3.org/2000/svg" class="turn" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/>
					<path d="m6 6 12 12"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/>
					<path d="m6 6 12 12"/>
				</svg>
			{/if}
		{/if}
	</div>
	<div class="w-fit mx-auto grid grid-cols-3 grid-rows-3 gap-0.5 bg-[#171717] rounded-xl overflow-hidden" bind:this={boardEl}>
		{#each board as row, r}
			{#each row as col, c}
				<div class="h-[100px] p-2 flex justify-center items-center bg-neutral-200 aspect-square">
					{#if col !== Move.Empty}
						<Icon move={col} />
					{:else if state === State.Playing}
						<EmptyCell on:click={() => place(r, c)}>
							<span class="hidden">
								Place row {r + 1} column {c + 1}
							</span>
						</EmptyCell>
					{/if}
				</div>
			{/each}
		{/each}
	</div>
	<div class="hidden lg:block justify-self-center my-auto relative">
		{#if state === State.Won}
			{#if winner === Move.O}
				<svg xmlns="http://www.w3.org/2000/svg" class="z-10 crown stroke-amber-500 absolute -top-8 right-2 rotate-12" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
				</svg>
				<svg xmlns="http://www.w3.org/2000/svg" class="winner" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
				</svg>
			{/if}
		{/if}
		{#if state === State.Playing}
			{#if turn === Move.O}
				<div class="absolute -rotate-45">
					<ChevronDown size="50" class="animate-bounce" />
				</div>
				<svg xmlns="http://www.w3.org/2000/svg" class="turn" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
				</svg>
			{/if}
		{/if}
	</div>
</div>

<!-- Moved turn display for smaller screens -->
<div class="w-[50%] mx-auto mt-4 flex flex-row justify-between">
	<div class="lg:hidden justify-self-center my-auto relative">
		{#if state === State.Won}
			{#if winner === Move.X}
				<svg xmlns="http://www.w3.org/2000/svg" class="z-10 crown stroke-amber-500 absolute -top-6 left-2 -rotate-12" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
				</svg>
				<svg xmlns="http://www.w3.org/2000/svg" class="winner" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/>
					<path d="m6 6 12 12"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/>
					<path d="m6 6 12 12"/>
				</svg>
			{/if}
		{/if}
		{#if state === State.Playing}
			{#if turn === Move.X}
				<svg xmlns="http://www.w3.org/2000/svg" class="turn" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/>
					<path d="m6 6 12 12"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/>
					<path d="m6 6 12 12"/>
				</svg>
			{/if}
		{/if}
	</div>
	<div class="lg:hidden justify-self-center my-auto relative">
		{#if state === State.Won}
			{#if winner === Move.O}
				<svg xmlns="http://www.w3.org/2000/svg" class="z-10 crown stroke-amber-500 absolute -top-6 right-2 rotate-12" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
				</svg>
				<svg xmlns="http://www.w3.org/2000/svg" class="winner" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
				</svg>
			{/if}
		{/if}
		{#if state === State.Playing}
			{#if turn === Move.O}
				<svg xmlns="http://www.w3.org/2000/svg" class="turn" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
				</svg>
			{/if}
		{/if}
	</div>
</div>

{#if state !== State.Playing}
	<div class="text-center mt-4">
		<button
			class="p-1 px-8 bg-indigo-500 hover:ring ring-indigo-300 text-white text-lg font-anton rounded-md active:scale-95 transition-all"
			on:click={reset}
		>
			Play Again
		</button>
	</div>
{/if}

<style>
	:global(body) {
		background-color: #171717;
		color: #ccc;
	}

	.turn {
		filter: drop-shadow(0 0 0.75rem white);
	}

	.winner {
		filter: drop-shadow(0 0 0.75rem green);
	}

	.loser {
		filter: drop-shadow(0 0 0.75rem red);
	}

	.crown {
		filter: drop-shadow(0 0 0.75rem gold);
	}
</style>
