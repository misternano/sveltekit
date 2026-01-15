<script lang="ts">
	import { Game } from "./components";
	import { Worm } from "lucide-svelte";
	import { swipe } from "svelte-gestures";
	import { onDestroy, onMount } from "svelte";
	import { browser } from "$app/environment";

	onMount(() => {
		debug = readDebug();
		debugTimer = window.setInterval(() => {
			const next = readDebug();
			if (next !== debug) debug = next;
		}, 1000);
		try {
			drawSnake();
			play();
			highestScore = parseInt(localStorage.getItem("snake:hiScore") || "0");
			console.info(`%c> Mounted`, "background-color:#1c68d4;color:white;padding:4rem;padding-block:0.5rem");
		} catch (_) {
			console.error("[Error mounting snake:hiScore] ",_)
		}
	});

	enum State { Playing, End, Paused }

	type Dir = "YD" | "YU" | "XL" | "XR";

	let state: State = State.Playing;
	const squareCount = 20;

	let board = new Array(squareCount).fill(null).map(() => new Array(squareCount).fill(null));
	let snake: Array<[number, number]> = [[5, 5]];

	let curDir: Dir = "YD";
	let queuedDir: Dir | null = null;

	let apple: [number, number] | null = null;
	let highestScore: number;
	let score: number = 0;

	const isOpposite = (a: Dir, b: Dir) =>
		(a === "YU" && b === "YD") ||
		(a === "YD" && b === "YU") ||
		(a === "XL" && b === "XR") ||
		(a === "XR" && b === "XL");

	const requestDir = (next: Dir) => {
		if (state !== State.Playing) return;
		if (!isOpposite(next, curDir)) queuedDir = next;
	};

	const drawSnake = () => {
		board = new Array(squareCount).fill(null).map(() => new Array(squareCount).fill(null));

		snake.forEach(([x, y]) => {
			board[y][x] = "S";
		});

		if (apple) board[apple[1]][apple[0]] = "A";
	};

	const getAppleCoordinates: () => [number, number] = () => {
		const x = Math.round(Math.random() * 100) % squareCount;
		const y = Math.round(Math.random() * 100) % squareCount;
		const coordinates: [number, number] = [x, y];

		if (snake.find(([sx, sy]) => sx === coordinates[0] && sy === coordinates[1])) return getAppleCoordinates();
		return coordinates;
	};

	const play = () => {
		if (state === State.Playing) {
			if (queuedDir) {
				curDir = queuedDir;
				queuedDir = null;
			}

			let prevHead: [number, number] = [snake[0][0], snake[0][1]];

			switch (curDir) {
				case "YD":
					snake[0][1] = snake[0][1] + 1;
					if (snake[0][1] >= squareCount) snake[0][1] = 0;
					break;
				case "YU":
					snake[0][1] = snake[0][1] - 1;
					if (snake[0][1] < 0) snake[0][1] = squareCount - 1;
					break;
				case "XR":
					snake[0][0] = snake[0][0] + 1;
					if (snake[0][0] >= squareCount) snake[0][0] = 0;
					break;
				case "XL":
					snake[0][0] = snake[0][0] - 1;
					if (snake[0][0] < 0) snake[0][0] = squareCount - 1;
					break;
			}

			if (snake.slice(1).find(([x, y]) => x === snake[0][0] && y === snake[0][1])) {
				localStorage.setItem("snake:hiScore", highestScore.toString());
				state = State.End;
				return;
			}

			for (let i = 1; i < snake.length; i++) {
				const temp = snake[i];
				snake[i] = prevHead;
				prevHead = temp;
			}

			if (!apple || (apple[0] === snake[0][0] && apple[1] === snake[0][1])) {
				if (apple) {
					snake.push(prevHead);
					score++;
				}
				apple = getAppleCoordinates();
			}

			if (score > highestScore) highestScore = score;

			drawSnake();
		}

		setTimeout(play, 150);
	};

	const togglePause = () => {
		if (state === State.Playing) state = State.Paused;
		else if (state === State.Paused) state = State.Playing;
		else {
			apple = getAppleCoordinates();
			board = new Array(squareCount).fill(null).map(() => new Array(squareCount).fill(null));
			snake = [[5, 5]];
			curDir = "YD";
			queuedDir = null;

			highestScore = parseInt(localStorage.getItem("snake:hiScore") || "0");
			score = 0;
			state = State.Paused;
			drawSnake();
			play();
		}
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (state === State.Playing) {
			switch (e.key) {
				case "ArrowLeft":
				case "a":
					requestDir("YU");
					break;
				case "ArrowRight":
				case "d":
					requestDir("YD");
					break;
				case "ArrowUp":
				case "w":
					requestDir("XL");
					break;
				case "ArrowDown":
				case "s":
					requestDir("XR");
					break;
			}
		}

		if (e.code === "Space") togglePause();
	};

	// Handling debug menu
	let debug = false
	let debugTimer: number | null = null

	const readDebug = () => {
		if (!browser) return false;
		return (
			localStorage.getItem("snake:debug") === "1" ||
			localStorage.getItem("arcade:debug") === "1"
		);
	}

	onDestroy(() => {
		if (debugTimer != null) window.clearInterval(debugTimer);
	});
</script>

<svelte:window on:keydown|preventDefault={onKeyDown} />

{#if debug}
	<div class="w-1/6 absolute right-3 top-16 text-xs text-white/70 border border-white/10 bg-white/5 rounded-lg p-3 space-y-1">
		<div class="flex justify-between">
			<span>Snake Debug Menu</span>
			<span class="text-yellow-100">state: {state}</span>
		</div>
		<br />
		<div class="flex justify-between"><span class="text-yellow-100">direction:</span><span>{curDir}</span></div>
		<div class="flex justify-between"><span class="text-yellow-100">queued dir:</span><span>{queuedDir}</span></div>
		<br />
		<button
			type="button"
			on:click={togglePause}
			class="px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
		>
			Reset
		</button>
	</div>
{/if}

<div
	use:swipe={{ timeframe: 300, minSwipeDistance: 60 }}
	on:swipe={(e) => {
		if (state !== State.Playing) return;

		switch (e.detail.direction) {
			case "left":
				requestDir("XL");
				break;
			case "right":
				requestDir("XR");
				break;
			case "top":
				requestDir("YU");
				break;
			case "bottom":
				requestDir("YD");
				break;
		}
	}}
	class="flex flex-col items-center"
>
	<header class="w-full relative mt-32 md:mt-16 my-16">
		<h1 class="font-impact font-medium text-4xl text-center">
			<span class="flex flex-row justify-center gap-2 bg-gradient-to-b from-green-500 to-green-600 bg-clip-text text-transparent">
				Feed
				<div class="relative">
					<Worm size={20} class="absolute top-0 left-1/2 -translate-x-1/2 fill-emerald-500 -rotate-45" />
					<span class="text-xl bg-gradient-to-b from-red-500 to-red-600 bg-clip-text text-transparent">the</span>
				</div>
				Snake
			</span>
		</h1>
		{#if state === State.End}
			<div
				class="-z-10 absolute -top-1/2 md:-translate-y-1/4 w-full text-center font-medium bg-gradient-to-b from-emerald-500/75 to-neutral-900 bg-clip-text text-transparent"
			>
				<h2 class="text-7xl md:text-9xl font-impact">HI SCORE {highestScore}</h2>
			</div>
		{/if}
	</header>

	<div class="relative">
		<Game highestScore={highestScore} score={score} board={board} headX={snake[0][0]} headY={snake[0][1]} />
		{#if state === State.Paused || state === State.End}
			<div class="absolute inset-0 flex items-center justify-center">
				<div class="absolute inset-0 bg-black/50 rounded-xl"></div>
				<div class="relative z-10 w-[min(28rem,90vw)] rounded-xl bg-neutral-950/80 ring-1 ring-neutral-700 p-6 text-center">
					<div class="font-impact text-4xl">
						{state === State.Paused ? "PAUSED" : "YOU DIED"}
					</div>
					<div class="mt-5 flex items-center justify-center gap-3">
						<button
							type="button"
							on:click={togglePause}
							class="px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
						>
							<span class="uppercase">{state === State.Paused ? "Resume" : "Play Again"}</span>
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<button
		on:click={togglePause}
		class={`${state === State.Paused && "hidden"} mt-6 px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60`}
	>
		Pause
	</button>
</div>
