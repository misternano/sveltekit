<svelte:head>
	<title>Tic-Tac-Toe</title>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:site_name" content="nanos.club feat. SvelteKit" />
	<meta property="og:title" content="Tic-Tac-Toe" />
	<meta property="og:description" content="Made with <3 in SvelteKit." />
</svelte:head>

<script lang="ts">
	import "../../app.css";
	import { Move, checkWinner, State } from "./util";
	import Icon from "./Icon.svelte";
	import EmptyCell from "./EmptyCell.svelte";
	import { tick } from "svelte";

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

<h1 class="text-4xl text-center my-16">
	Tic-Tac-Toe
</h1>

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

<div class="mt-4 flex flex-col items-center gap-2">
	<div class="text-xl" bind:this={statusEl}>
		{#if state === State.Won}
			{winner} won.
		{:else if state === State.Draw}
			It's a draw!
		{:else}
			It's {turn}'s turn.
		{/if}
	</div>
	{#if state !== State.Playing}
		<button
			class="p-1 px-6 bg-indigo-500 text-white rounded-md hover:-translate-y-0.5 active:scale-95 transition-all"
			on:click={reset}
		>
			Play again?
		</button>
	{/if}
</div>

<style>
	:global(body) {
		background-color: #171717;
		color: #ccc;
	}
</style>
