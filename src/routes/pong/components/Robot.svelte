<script lang="ts">
	import { fade } from "svelte/transition";

	export let pos_x: number;
	export let alive: boolean = true;
</script>

<div class="flex items-end w-full h-[5vh]">
	{#if alive}
		<div
			class="w-[20vw] h-1/2 bg-sky-900"
			style="transform: translateX({pos_x}vmin);"
			transition:fade
		/>
	{/if}
</div>
