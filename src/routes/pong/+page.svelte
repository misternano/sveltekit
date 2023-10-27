<script lang="ts">
	import "../../app.css";
	import { onMount } from "svelte";
	import { State } from "./lib/util";
	import { player } from "./stores/player";
	import { robot } from "./stores/robot";
	import { ball } from "./stores/ball";
	import { keystate } from "./stores/keystate";
	import Player from "./components/Player.svelte";
	import Robot from "./components/Robot.svelte";
	import Ball from "./components/Ball.svelte";

	let state: State = State.Paused

	onMount(() => {
		let raf: number;
		const game_loop = () => {
			raf = requestAnimationFrame(game_loop);
			if (state != State.Paused) {
				player.update($keystate, $ball);
				robot.update($ball);
				ball.update($player, $robot);
			}
		}

		game_loop();

		return () => cancelAnimationFrame(raf);
	})

	const resetGame = () => {
		player.reset();
		robot.reset();
		ball.reset();
	}

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === "p") {
			event.preventDefault();
			state != State.Paused
			return;
		}
		if (event.key === "r") {
			event.preventDefault();
			resetGame();
			state = State.Playing
			return;
		}
		keystate.keydown(event);
	}

	const handleKeyup = (event: KeyboardEvent) => {
		keystate.keyup(event);
	}
</script>

<div class="flex justify-center items-center w-full h-full bg-sky-900">
	<div class="w-full h-full bg-white">
		<Robot pos_x={$robot.pos_x} alive={$robot.alive} />
		<Ball pos_x={$ball.pos_x} pos_y={$ball.pos_y} alive={$ball.alive} />
		<Player pos_x={$player.pos_x} alive={$player.alive} />
	</div>
</div>

<style>
	:global(body) {
		background-color: #171717;
		overflow: hidden;
	}
</style>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup} />
