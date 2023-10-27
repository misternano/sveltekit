<script lang="ts">
	export let object: string;
</script>

<div class={`w-[19px] md:w-[25px] border-[0.5px] border-dotted border-neutral-600 aspect-square
	${
		object === 'A'
			? 'bg-gradient-to-br from-red-500 to-red-800 rounded-lg'
		: object === 'S'
			? 'bg-gradient-to-b from-green-400 to-green-600 rounded-md'
		: ''
	}`}
/>
