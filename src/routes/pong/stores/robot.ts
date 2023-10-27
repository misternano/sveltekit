import { writable } from "svelte/store";
import type { Ball, Robot } from "../lib/types";

const initial = {
	pos_x: 20,
	speed_x: 1,
	alive: true,
	response_time: 0
}

const approx_intersect = (ball: Ball) => {
	const time = ball.pos_y / Math.abs(ball.speed_y);
	let intersect = ball.pos_x + (time * ball.speed_x);
	if (intersect < 0)
		intersect = Math.abs(intersect);

	if (intersect > 100)
		intersect = 100 - (intersect % 100);

	return intersect
}

const createRobotStore = () => {
	const store = writable(Object.assign({}, initial));

	const update = (ball: Ball) => {
		store.update((robot: Robot) => {
			if (!robot.alive)
				return robot;

			const new_robot = Object.assign({}, robot);

			if (--new_robot.response_time <= 0) {
				if (ball.speed_y > 0) {
					new_robot.response_time = ball.pos_y > 69 ? 21 : 34;
					new_robot.speed_x = ball.pos_x - (new_robot.pos_x + 10) > 0 ? 1 : -1;
				} else {
					new_robot.response_time = ball.pos_y < 42 ? 8 : 13;
					new_robot.speed_x = approx_intersect(ball) - (new_robot.pos_x + 10) > 0 ? 1 : -1;
				}
			}

			const next_pos_x = robot.pos_x + robot.speed_x;
			if (next_pos_x <= 0) {
				new_robot.pos_x = 0;
				new_robot.speed_x = 1;
			}
			if (next_pos_x >= 80) {
				new_robot.pos_x = 80;
				new_robot.speed_x = -1;
			}

			if (!ball.alive) {
				new_robot.speed_x = 0;
			}

			new_robot.pos_x += new_robot.speed_x;

			// Death check
			if (ball.pos_y < -3)
				new_robot.alive = false;

			return Object.assign({}, new_robot);
		})
	}

	const reset = () => store.set(Object.assign({}, initial));

	return {
		subscribe: store.subscribe,
		update,
		reset
	}
}

export const robot = createRobotStore();
