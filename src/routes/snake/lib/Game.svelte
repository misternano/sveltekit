<script lang="ts">
	import Square from "./game/Square.svelte";
	export let score: number;
	export let highestScore: number;
	export let board: any;
</script>

<div class="w-full">
	<div class="flex items-center justify-between text-xs">
		<span>Score: {score}</span>
		<span>Hi Score: {highestScore}</span>
	</div>
	<div class="w-full border-2 border-solid border-black">
		{#each board as row}
			<div>
				{#each row as square}
					<Square object={square} />
				{/each}
			</div>
		{/each}
	</div>
</div>
