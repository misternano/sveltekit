<script>
	import { ChevronLeft } from "lucide-svelte";
</script>

<svelte:head>
	<title>log4j | Pong</title>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:site_name" content="arcade.log4j.dev" />
	<meta property="og:title" content="ARCADE | Pong" />
	<meta property="og:description" content="Made with <3 in SvelteKit." />
</svelte:head>

<div class="absolute top-0 left-5">
	<a href="/" class="flex flex-row gap-2 items-center px-4 bg-indigo-500 ring ring-indigo-300 text-white rounded-md rounded-t-none hover:scale-105 transition-all">
		<ChevronLeft size="16" />
		<span class="text-lg">Back</span>
	</a>
</div>
<slot />
