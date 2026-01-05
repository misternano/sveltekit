<script>
	import "../../app.css";
	import { ChevronLeft } from "lucide-svelte";
	import { NavBarGames } from "../components";
</script>

<svelte:head>
	<title>BKCLB Arcade | Snake</title>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:site_name" content="arcade.bkclb.dev" />
	<meta property="og:title" content="ARCADE | Snake" />
	<meta property="og:description" content="Made with <3 in SvelteKit." />
</svelte:head>

<nav class="absolute top-0 left-5">
	<div class="flex flex-row gap-6">
		<a href="/" class="flex flex-row gap-2 items-center py-1 lg:py-0 px-4 bg-indigo-500 ring ring-indigo-300 text-white rounded-md rounded-t-none hover:scale-105 transition-all">
			<ChevronLeft size="16" />
			<span class="hidden md:block text-lg">Back</span>
		</a>
		<NavBarGames />
	</div>
</nav>
<slot />
