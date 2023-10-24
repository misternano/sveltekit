<script lang="ts">
	import "../app.css";
	import { createCountStore } from "$lib";

	export const count = createCountStore(0, onChange)

	function onChange(value: number) {
		console.log("count changed to", value)
	}
</script>

<svelte:head>
	<title>Playground</title>
</svelte:head>

<div class="max-w-lg mx-auto bg-neutral-200 rounded-xl p-6 shadow-xl grid place-items-center mt-32">
	<header class="mb-4 flex flex-col items-center">
		<h1 class="underline uppercase text-xs">count</h1>
		<span class="text-indigo-500 font-bold text-4xl">
			{$count}
		</span>
	</header>
	<div class="w-[75%] flex flex-col gap-2">
		<div class="flex flex-row gap-2">
			<button class="flex flex-1 justify-center p-1 px-4 bg-indigo-500 hover:ring ring-indigo-300 text-white rounded-md transition-all" on:click={count.increment}>
				+
			</button>
			<button class="flex flex-1 justify-center p-1 px-4 bg-indigo-500 hover:ring ring-indigo-300 text-white rounded-md transition-all" on:click={count.decrement}>
				-
			</button>
			<button class="flex flex-1 justify-center p-1 px-4 bg-indigo-500 hover:ring ring-indigo-300 text-white rounded-md transition-all" on:click={count.square}>
				√
			</button>
		</div>
		<button class="p-1 px-4 bg-indigo-500 hover:ring ring-indigo-300 text-white rounded-md transition-all" on:click={count.reset}>
			Reset
		</button>
	</div>
</div>
