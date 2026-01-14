<script lang="ts">
	import { NotebookPen } from "lucide-svelte";

	export let noteMode: boolean
	export let toggleNoteMode: () => void
	export let onNumberSelect: (n: number) => void
</script>

<div class="max-w-[90vw] mx-auto flex flex-wrap justify-center gap-2 mt-6 font-anton">
	{#each Array(9) as _, i}
		<button
			type="button"
			class=" flex flex-row text-2xl items-center gap-2 px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
			on:click={() => onNumberSelect(i + 1)}
		>
			{i + 1}
		</button>
	{/each}
	<button
		type="button"
		class={`flex flex-row items-center gap-2 px-2.5 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60 ${noteMode && "bg-indigo-700 ring"}`}
		on:click={toggleNoteMode}
		aria-pressed={noteMode}
		aria-label="Toggle note mode"
	>
		<NotebookPen size="24" />
	</button>
</div>
