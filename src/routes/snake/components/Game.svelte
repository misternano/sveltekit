<script lang="ts">
	import Square from "./Square.svelte"
	export let score: number
	export let highestScore: number
	export let board: any
	export let headX: number
	export let headY: number
</script>

<div>
	<div class="flex justify-between">
		<p class="font-medium bg-gradient-to-b from-emerald-500 to-emerald-800 bg-clip-text text-transparent text-md font-impact">
			SCORE <span class="font-impact font-medium text-md text-center text-white">{score}</span>
		</p>
		<p class="font-medium bg-gradient-to-b from-emerald-500 to-emerald-800 bg-clip-text text-transparent text-md font-impact">
			HI SCORE <span class="font-impact font-medium text-md text-center text-white">{highestScore}</span>
		</p>
	</div>

	<div class="w-full flex border-2 border-double">
		{#each board as row, y}
			<div>
				{#each row as square, x}
					<Square object={square} isHead={square === "S" && x === headX && y === headY} />
				{/each}
			</div>
		{/each}
	</div>
</div>
