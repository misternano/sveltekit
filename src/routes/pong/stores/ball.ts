import { writable } from "svelte/store";
import type { Player, Robot } from "../lib/types";

const initial = () => ({
	pos_x: 48,
	pos_y: 40,
	speed_x: (0.1 * (Math.random() > 0.5 ? 1 : -1)),
	speed_y: (0.1 * (Math.random() > 0.5 ? 1 : -1)),
	alive: true
})

const createBallStore = () => {
	const store = writable(Object.assign({}, initial()));

	const update = (player: Player, robot: Robot) => {
		store.update(ball => {
			if (!ball.alive)
				return ball;

			const new_ball = Object.assign({}, ball);
			const next_pos_y = new_ball.pos_y + new_ball.speed_y;
			const next_pos_x = new_ball.pos_x + new_ball.speed_x;

			// Kill ball if player or robot is dead
			if (!player.alive || !robot.alive)
				new_ball.alive = false;

			// Player collision handler
			if (next_pos_y >= 88) {
				if (((player.pos_x - 2) <= new_ball.pos_x) && ((player.pos_x + 20) >= new_ball.pos_x)) {
					new_ball.speed_y = -1 * (new_ball.speed_y + 0.05);
					if (player.speed_x !== 0)
						new_ball.speed_x += Math.round((player.speed_x / 10) * 10) / 10;
				}
			}

			// Robot collision handler
			if (next_pos_y <= 0) {
				if (((robot.pos_x) <= new_ball.pos_x) && ((robot.pos_x + 20) >= new_ball.pos_x)) {
					new_ball.speed_y = -1 * (new_ball.speed_y - 0.05);
					if (robot.speed_x !== 0)
						new_ball.speed_x += Math.round((robot.speed_x / 10) * 10) / 10;
				}
			}

			// Wall collision handler
			if (next_pos_x <= 0) {
				new_ball.pos_x = 0;
				new_ball.speed_x = -1 * new_ball.speed_x;
			}

			if (next_pos_x >= 98) {
				new_ball.pos_x = 98;
				new_ball.speed_x = -1 * new_ball.speed_x;
			}

			// Speed handler
			if (new_ball.speed_x <= -Math.SQRT1_2)
				new_ball.speed_x = -Math.SQRT1_2

			if (new_ball.speed_x >= Math.SQRT1_2)
				new_ball.speed_x = Math.SQRT1_2

			if (new_ball.speed_y <= -Math.SQRT2)
				new_ball.speed_y = -Math.SQRT2

			if (new_ball.speed_y >= Math.SQRT2)
				new_ball.speed_y = Math.SQRT2

			// Position handler
			new_ball.pos_x = next_pos_x + new_ball.speed_x;
			new_ball.pos_y = next_pos_y + new_ball.speed_y;

			return Object.assign({}, new_ball);
		})
	}

	const reset = () => store.set(Object.assign({}, initial()));

	return {
		subscribe: store.subscribe,
		update,
		reset
	}
}

export const ball = createBallStore();
