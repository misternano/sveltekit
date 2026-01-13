import { browser } from "$app/environment";
import { writable } from "svelte/store";

export type LastGame = {
	slug: string;
	name: string;
	path: string;
	updatedAt: number;
}

const KEY = "arcade:lastGame"

const read = (): LastGame | null => {
	if (!browser) return null
	try {
		const raw = localStorage.getItem(KEY)
		return raw ? (JSON.parse(raw) as LastGame) : null
	} catch (_) {
		console.error(`[Issue reading ${KEY}]: `,_)
		return null
	}
}

export const lastGame = writable<LastGame | null>(read())

export const setLastGame = (v: LastGame) => {
	lastGame.set(v)
	if (!browser) return
	try {
		localStorage.setItem(KEY, JSON.stringify(v))
	} catch (_) {
		console.error(`[Issue writing ${KEY}]: `,_)
	}
}
