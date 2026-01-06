<script lang="ts">
	import "../app.css"
	import { Zap } from "lucide-svelte"
	import { NavBarGames } from "./components"
</script>

<nav class="absolute top-0 left-5">
	<div class="flex flex-row gap-6">
		<a href="/" class="flex flex-row gap-2 items-center py-1 lg:py-0 px-4 md:px-3 bg-indigo-500 ring ring-indigo-300 text-white rounded-md rounded-t-none hover:scale-105 transition-all">
			<Zap size="16" class="fill-[#ecba16] stroke-[#ecba16]" />
			<span class="hidden md:block text-md">BKCLB</span>
		</a>
		<NavBarGames />
	</div>
</nav>
<slot />
