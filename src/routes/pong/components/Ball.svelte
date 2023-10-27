<script lang="ts">
	import { fade } from "svelte/transition";

	export let pos_x: number;
	export let pos_y: number;
	export let alive: boolean = true;
</script>

<div class="w-full h-[90vh]">
	{#if alive}
		<div
			class="w-8 h-8 bg-rose-600"
			style="transform: translate({pos_x}vmin, {pos_y}vmin);"
			transition:fade
		/>
	{/if}
</div>
