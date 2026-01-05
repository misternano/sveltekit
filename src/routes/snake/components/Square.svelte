<script lang="ts">
	export let object: string
	export let isHead = false
</script>

<div
	class={`w-[19px] md:w-[25px] aspect-square border-[0.5px] border-dotted border-neutral-600
		${isHead
			? "bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-lg scale-110 scale-110 z-10"
			: object === "S"
			? "bg-gradient-to-br from-green-400 to-green-600 rounded-md"
			: object === "A"
			? "bg-gradient-to-br from-red-500 to-red-800 rounded-lg"
			: ""}`}
/>
