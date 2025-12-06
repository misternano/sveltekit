<script lang="ts">
	import { Pencil } from "lucide-svelte";

	export let noteMode: boolean
	export let toggleNoteMode: () => void
	export let onNumberSelect: (n: number) => void
</script>

<div class="flex flex-wrap justify-center gap-2 mt-6">
	{#each Array(9) as _, i}
		<button
			type="button"
			class="p-2 px-4 bg-indigo-500 hover:ring ring-indigo-300 text-white rounded-md active:scale-95 transition-all"
			on:click={() => onNumberSelect(i + 1)}
		>
			{i + 1}
		</button>
	{/each}
	<button
		type="button"
		class={`p-2 px-4 bg-indigo-500 hover:ring ring-indigo-300 text-white rounded-md active:scale-95 transition-all flex items-center justify-center ${noteMode === true ? 'bg-indigo-800 ring' : ''}`}
		on:click={toggleNoteMode}
		aria-pressed={noteMode}
		aria-label="Toggle note mode"
	>
		<Pencil size="16" />
	</button>
</div>
