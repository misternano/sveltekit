<script lang="ts">
	import "../app.css";
</script>

<svelte:head>
	<title>log4j Arcade</title>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:site_name" content="arcade.log4j.dev" />
	<meta property="og:title" content="Arcade" />
	<meta property="og:description" content="JS Retro Games Arcade" />
</svelte:head>

<div class="relative">
	<h1 class="w-fit mx-auto font-impact font-medium text-4xl text-center my-16">
		Arcade Games
	</h1>
	<div class="-z-10 absolute -top-1/2 md:-translate-y-1/4 w-full text-center font-medium bg-gradient-to-b from-neutral-800 to-neutral-900 bg-clip-text text-transparent">
		<h2 class="text-8xl md:text-9xl font-impact uppercase">
			log4j.dev
		</h2>
	</div>
</div>

<div class="w-[90%] md:w-[50%] mt-40 md:mt-0 mx-auto flex flex-row flex-wrap gap-4">
	<a href="/snake" class="p-2 px-8 bg-indigo-500 hover:ring ring-indigo-300 text-white rounded-md active:scale-95 transition-all">
		Snake
	</a>
	<a href="/tictactoe" class="p-2 px-8 bg-indigo-500 hover:ring ring-indigo-300 text-white rounded-md active:scale-95 transition-all">
		Tic Tac Toe
	</a>
	<div class="p-2 px-8 bg-neutral-500 hover:ring ring-red-500 text-neutral-200 rounded-md cursor-not-allowed transition-all">
		Tetris
	</div>
	<div class="p-2 px-8 bg-neutral-500 hover:ring ring-red-500 text-neutral-200 rounded-md cursor-not-allowed transition-all">
		Pac-Man
	</div>
	<div class="p-2 px-8 bg-neutral-500 hover:ring ring-red-500 text-neutral-200 rounded-md cursor-not-allowed transition-all">
		Space Invaders
	</div>
	<a href="/pong" class="p-2 px-8 bg-indigo-500 hover:ring ring-indigo-300 text-white rounded-md active:scale-95 transition-all">
		Pong
	</a>
</div>

<style>
	:global(body) {
		@apply bg-neutral-900 text-[#cccccc] select-none;
	}
</style>
