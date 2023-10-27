<script lang="ts">
	import "../../app.css";
	import Game from "./components/Game.svelte";
	import { Play, RotateCcw } from "lucide-svelte";
	import { swipe } from "svelte-gestures";
	import { onMount } from "svelte";
	import { State } from "./lib/util";

	let state: State = State.Playing;
	const squareCount = 20;

	let board = new Array(squareCount)
		.fill(null)
		.map(() => new Array(squareCount).fill(null));
	let snake = [[5, 5]];
	let curDir: "YD" | "YU" | "XL" | "XR" = "YD";
	let apple: Array<number> | null = null;
	let highestScore: number;
	let score: number = 0;

	onMount(() => {
		highestScore = parseInt(localStorage.getItem("hiScore") || "0");
	})

	const drawSnake = () => {
		board = new Array(squareCount)
			.fill(null)
			.map(() => new Array(squareCount).fill(null));
		snake.forEach(([x, y]) => {
			board[y][x] = "S";
		})

		if (apple)
			board[apple[1]][apple[0]] = "A";
	}

	const getAppleCoordinates: () => [number, number] = () => {
		const x = Math.round(Math.random() * 100) % squareCount;
		const y = Math.round(Math.random() * 100) % squareCount;
		const coordinates: [number, number] = [x, y];

		if (snake.find(([x, y]) => x == coordinates[0] && y == coordinates[1]))
			return getAppleCoordinates();
		return coordinates;
	}

	const play = () => {
		if (state === State.Playing) {
			let prevHead = [snake[0][0], snake[0][1]];
			switch(curDir) {
				case "YD":
					snake[0][1] = snake[0][1] + 1;
					if (snake[0][1] >= squareCount)
						snake[0][1] = 0;
					break;
				case "YU":
					snake[0][1] = snake[0][1] - 1;
					if (snake[0][1] < 0)
						snake[0][1] = squareCount - 1;
					break;
				case "XR":
					snake[0][0] = snake[0][0] + 1;
					if (snake[0][0] >= squareCount)
						snake[0][0] = 0;
					break;
				case "XL":
					snake[0][0] = snake[0][0] - 1;
					if (snake[0][0] < 0)
						snake[0][0] = squareCount - 1;
					break;
			}

			if (snake.slice(1, snake.length).find(([x, y]) => x == snake[0][0] && y == snake[0][1])) {
				localStorage.setItem("hiScore", highestScore.toString());
				state = State.End;
				return;
			}

			for (let i = 1; i < snake.length; i++) {
				const temp = snake[i];
				snake[i] = prevHead;
				prevHead = temp;
			}

			if (!apple || (apple[0] == snake[0][0] && apple[1] == snake[0][1])) {
				if (apple) {
					snake.push(prevHead);
					score++;
				}
				apple = getAppleCoordinates();
			}

			if (score > highestScore)
				highestScore = score;

			drawSnake();
		}

		setTimeout(play, 150);
	}

	const togglePause = () => {
		if (state === State.Playing)
			state = State.Paused;
		else if (state === State.Paused)
			state = State.Playing;
		else {
			apple = getAppleCoordinates();
			board = new Array(squareCount)
				.fill(null)
				.map(() => new Array(squareCount).fill(null));
			snake = [[5, 5]];
			curDir = "YD";

			highestScore = parseInt(localStorage.getItem("hiScore") || "0");
			score = 0;
			state = State.Paused;
			drawSnake();
			play();
		}
	}

	const onKeyDown = (e: KeyboardEvent) => {
		if (state === State.Playing) {
			switch (e.key) {
				case "ArrowLeft":
					if (curDir !== "YD") curDir = "YU";
					break;
				case "ArrowRight":
					if (curDir !== "YU") curDir = "YD";
					break;
				case "ArrowUp":
					if (curDir !== "XR") curDir = "XL";
					break;
				case "ArrowDown":
					if (curDir !== "XL") curDir = "XR";
					break;
				case "a":
					if (curDir !== "YD") curDir = "YU";
					break;
				case "d":
					if (curDir !== "YU") curDir = "YD";
					break;
				case "w":
					if (curDir !== "XR") curDir = "XL";
					break;
				case "s":
					if (curDir !== "XL") curDir = "XR";
					break;
			}
		}

		if (e.code == "Space")
			togglePause();
	}

	onMount(() => {
		drawSnake();
		play();
	})
</script>

<div
	use:swipe={{ timeframe: 300, minSwipeDistance: 60 }}
	on:swipe={(e) => {
			if (state === State.Playing) {
            switch (e.detail.direction) {
                case "left":
                    if (curDir !== "YD") curDir = "YU";
                    break;
                case "right":
                    if (curDir !== "YU") curDir = "YD";
                    break;
                case "top":
                    if (curDir !== "XR") curDir = "XL";
                    break;
                case "bottom":
                    if (curDir !== "XL") curDir = "XR";
                    break;
            }
        }
		}}
	class="m-8 flex flex-col items-center"
>
	<div class="w-full relative my-4">
		<h1 class="font-impact font-medium text-4xl text-center">
			Feed <span class="text-xl">the</span> Snake
		</h1>
		{#if state === State.End}
			<div class="-z-10 absolute -top-1/2 md:-translate-y-1/4 w-full text-center font-medium bg-gradient-to-b from-emerald-500/75 to-neutral-900 bg-clip-text text-transparent">
				<h2 class="text-7xl md:text-9xl font-impact">
					HI SCORE {highestScore}
				</h2>
			</div>
		{/if}
	</div>

	<div class="relative">
		<Game highestScore={highestScore} score={score} board={board} />
		{#if state === State.Paused}
			<div class="absolute inset-0 top-6 bg-black/10 backdrop-blur-lg">
				<div class="h-full flex flex-col gap-4 justify-center items-center">
					<h1 class="text-4xl text-center font-impact tracking-widest">PAUSED</h1>
					<button on:click={togglePause} class="mx-auto flex flex-row gap-2 items-center p-1 px-4 bg-indigo-500 hover:ring ring-indigo-300 text-white text-md font-anton rounded-md active:scale-95 transition-all">
						<Play class="fill-white" size="16" />
						<span class="uppercase">Resume</span>
					</button>
					<p class="text-center text-xs">or press <span class="text-md font-anton text-indigo-500">SPACE</span></p>
				</div>
			</div>
		{:else if state === State.End}
			<div class="absolute inset-0 top-6 bg-black/10 backdrop-blur-sm">
				<div class="h-full flex flex-col gap-4 justify-center items-center">
					<h1 class="text-4xl text-center text-red-500 font-impact tracking-widest">YOU DIED</h1>
					<button on:click={togglePause} class="mx-auto flex flex-row gap-2 items-center p-1 px-4 bg-indigo-500 hover:ring ring-indigo-300 text-white text-md font-anton rounded-md active:scale-95 transition-all">
						<RotateCcw size="16" />
						<span class="uppercase">Restart</span>
					</button>
					<p class="text-center text-xs">or press <span class="text-md font-anton text-indigo-500">SPACE</span></p>
				</div>
			</div>
		{/if}
	</div>
</div>

<svelte:window on:keydown|preventDefault={onKeyDown} />

<style>
	:global(body) {
		@apply bg-neutral-900 text-[#cccccc];
	}
</style>
