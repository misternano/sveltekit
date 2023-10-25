<script lang="ts">
	import Game from "./lib/Game.svelte";
	import { Pause, Play, RotateCcw } from "lucide-svelte";
	import { swipe } from "svelte-gestures";

	let playingStatus: "Pause" | "Play" | "End" = "Pause"
	$: isPlaying = playingStatus == "Play";
	const squareCount = 20;

	let board = new Array(squareCount)
		.fill (null)
		.map(() => new Array(squareCount).fill(null));
	let snake = [[5, 5]];
	let curDir: "YD" | "YU" | "XL" | "XR" = "YD";
	let apple: Array<number> | null = null;
	// let highestScore: number = parseInt(localStorage.getItem("hiScore") || "0");
	let highestScore: number = 0;
	let score: number = 0;

	const drawSnake = () => {
		board = new Array(squareCount)
			.fill (null)
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
		if (isPlaying) {
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
				case "XL":
					snake[0][0] = snake[0][0] - 1;
					if (snake[0][0] < 0)
						snake[0][0] = squareCount - 1;
					break;
				case "XR":
					snake[0][0] = snake[0][0] + 1;
					if (snake[0][0] >= squareCount)
						snake[0][0] = 0;
					break;
			}

			if (snake.slice(1, snake.length).find(([x, y]) => x == snake[0][0] && y == snake[0][1])) {
				// localStorage.setItem("hiScore", highestScore.toString());
				playingStatus = "End";
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

		setTimeout(play, 200);
	}

	const togglePause = () => {
		if (playingStatus === "Play")
			playingStatus = "Pause";
		else if (playingStatus === "Pause")
			playingStatus = "Play";
		else {
			apple = getAppleCoordinates();
			board = new Array(squareCount)
				.fill (null)
				.map(() => new Array(squareCount).fill(null));
			snake = [[5, 5]];
			curDir = "YD";

			// highestScore = parseInt(localStorage.getItem("hiScore") || "0");
			highestScore = 0;
			score = 0;
			playingStatus = "Pause";
			drawSnake();
			play();
		}
	}

	const onKeyDown = (e: KeyboardEvent) => {
		if (isPlaying) {
			switch (e.key) {
				case "ArrowUp":
					if (curDir != "YD") curDir = "YU";
					break;
				case "ArrowDown":
					if (curDir != "YU") curDir = "YD";
					break;
				case "ArrowLeft":
					if (curDir != "XR") curDir = "XL";
					break;
				case "ArrowRight":
					if (curDir != "XL") curDir = "XR";
					break;
				case "w":
					if (curDir != "YD") curDir = "YU";
					break;
				case "s":
					if (curDir != "YU") curDir = "YD";
					break;
				case "a":
					if (curDir != "XR") curDir = "XL";
					break;
				case "d":
					if (curDir != "XL") curDir = "XR";
					break;
			}
		}

		if (e.code == "Space")
			togglePause();
	}
</script>

<div class="w-full flex items-start justify-between h-[100vh]">
	<section
		use:swipe={{ timeframe: 300, minSwipeDistance: 60 }}
		on:swipe={(e) => {
			if (isPlaying) {
				switch (e.detail.direction) {
					case "top":
						if (curDir !== "YD") curDir = "YU";
						break;
					case "bottom":
						if (curDir !== "YU") curDir = "YD";
						break;
					case "left":
						if (curDir !== "XR") curDir = "XL";
						break;
					case "right":
						if (curDir !== "XL") curDir = "XR";
						break;
				}
			}
		}}
		class="w-full lg:w-[70%] min-h-full p-[25px] flex flex-col items-center justify-between lg:justify-evenly"
	>
		<h1 class="w-full text-center font-bold text-4xl">
			Feed The Snake
		</h1>
		<Game highestScore={highestScore} score={score} board={board} />
		<button on:click={togglePause} class="p-1 px-8 bg-indigo-500 hover:ring ring-indigo-300 text-white text-lg font-anton rounded-md active:scale-95 transition-all">
			{#if playingStatus === "Play"}
				<Pause size="20" />
			{:else if playingStatus === "Pause"}
				<Play size="20" />
			{:else}
				<RotateCcw size="20" />
			{/if}
		</button>
	</section>
</div>

<svelte:window on:keydown|preventDefault={onKeyDown} />
