<script lang="ts">
	import { X, Circle } from "lucide-svelte";
	import { Move } from "../lib/util";

	export let move: Move;
</script>

{#if move === Move.X}
	<X color="black" size="75" />
{:else}
	<Circle color="black" size="75" />
{/if}

<span class="hidden">
	{#if move === Move.X}
		X
	{:else}
		O
	{/if}
</span>
