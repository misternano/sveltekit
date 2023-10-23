import { type Updater, writable } from "svelte/store";

const createCountStore = (initialValue: number, onChange?: (value: number) => void) => {
	const count = writable(initialValue);

	function update(updater: Updater<number>) {
		count.update((current) => {
			const newValue = updater(current);
			if (current !== newValue)
				onChange?.(newValue);
			return newValue;
		})
	}

	function increment() {
		update((c) => c + 1);
	}

	function decrement() {
		update((c) => c - 1);
	}

	function reset() {
		update(() => initialValue);
	}

	function square() {
		update((c) => c * c);
	}

	return {
		...count,
		update,
		increment,
		decrement,
		reset,
		square,
	}
}

export default createCountStore;
