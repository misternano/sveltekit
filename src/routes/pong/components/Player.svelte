<script lang="ts">
	import { fade } from "svelte/transition";

	export let pos_x: number;
	export let alive: boolean = true;
</script>

<div class="w-full h-[5vh]">
	{#if alive}
		<div
			class="flex items-start w-8"
			style="transform: translateX({pos_x}vmin);"
			transition:fade
		/>
	{/if}
</div>
