<script lang="ts">
	export let disabled = false;
</script>

<button
	class="h-full w-full rounded-md
	hover:bg-slate-500/50 focus-visible:bg-slate-500/50
	hover:shadow-lg focus-visible:shadow-lg
	hover:border focus-visible:border focus-visible:ring-0
	border-slate-800/50 animate-pulse disabled:cursor-not-allowed"
	on:click {disabled}
>
	<slot />
</button>
