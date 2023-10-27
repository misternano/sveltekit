export interface Player {
	pos_x: number;
	speed_x: number;
	alive: boolean;
}

export interface Robot {
	pos_x: number;
	speed_x: number;
	alive: boolean;
	response_time: number;
}

export interface Keystate {
	pos_x: number;
	speed_x: number;
	alive: boolean;
	response_time: number;
	a: boolean;
	d: boolean;
	ArrowLeft: boolean;
	ArrowRight: boolean;
}

export interface Ball {
	pos_x: number;
	pos_y: number;
	speed_x: number;
	speed_y: number;
	alive: boolean;
}
