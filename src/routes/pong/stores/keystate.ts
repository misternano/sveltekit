import { writable } from "svelte/store";

const createKeystateStore = () => {
	const store = writable({
		a: false,
		d: false,
		ArrowLeft: false,
		ArrowRight: false
	})

	const setKey = (event: KeyboardEvent, value: boolean) => {
		store.update(keystate => {
			if (keystate.hasOwnProperty(event.key))
				event.preventDefault();

			if (!keystate.hasOwnProperty(event.key) || keystate[event.key] === value)
				return keystate;

			return Object.assign({}, keystate, { [event.key]: value })
		})
	}

	const keydown = (event: KeyboardEvent) => setKey(event, true);
	const keyup = (event: KeyboardEvent) => setKey(event, false);

	return {
		subscribe: store.subscribe,
		keydown,
		keyup
	}
}

export const keystate = createKeystateStore();
