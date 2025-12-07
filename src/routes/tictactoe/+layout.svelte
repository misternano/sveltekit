<script>
import { ChevronLeft } from "lucide-svelte";
import { NavBarGames } from "../components/index.ts";
</script>

<svelte:head>
	<title>BKCLB Arcade | Tic-Tac-Toe</title>
	<link rel="icon" href="https://nanos.club/flash.png" />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:site_name" content="arcade.bkclb.dev" />
	<meta property="og:title" content="ARCADE | Tic-Tac-Toe" />
	<meta property="og:description" content="Made with <3 in SvelteKit." />
</svelte:head>

<nav class="absolute top-0 left-5">
	<div class="flex flex-row gap-6">
		<a href="/" class="flex flex-row gap-2 items-center px-4 bg-indigo-500 ring ring-indigo-300 text-white rounded-md rounded-t-none hover:scale-105 transition-all">
			<ChevronLeft size="16" />
			<span class="text-lg">Back</span>
		</a>
		<NavBarGames />
	</div>
</nav>
<slot />
