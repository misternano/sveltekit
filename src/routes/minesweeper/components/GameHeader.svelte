<script lang="ts">
	import { minesweeper, minesLeft, elapsedSeconds, DIFFICULTIES, clampCustomDifficulty, type DifficultyKey } from "../lib/util";
	import { onDestroy } from "svelte";
	import { Bomb, Clock } from "lucide-svelte";

	let customRows = 16;
	let customCols = 16;
	let customMines = 40;

	let selectedDifficulty: DifficultyKey = "beginner";

	let customApplyTimer: number | null = null;

	const startPreset = (key: DifficultyKey) => {
		if (key === "custom") {
			const d = clampCustomDifficulty(customRows, customCols, customMines);
			customRows = d.rows;
			customCols = d.cols;
			customMines = d.mines;
			minesweeper.newGame("custom", { rows: customRows, cols: customCols, mines: customMines });
			return;
		}
		minesweeper.newGame(key);
	};

	const onDifficultyChange = (e: Event) => {
		const key = (e.currentTarget as HTMLSelectElement).value as DifficultyKey;
		selectedDifficulty = key;
		startPreset(key);
	};

	const scheduleApplyCustom = () => {
		if (selectedDifficulty !== "custom") return;

		if (customApplyTimer != null) window.clearTimeout(customApplyTimer);
		customApplyTimer = window.setTimeout(() => {
			startPreset("custom");
		}, 250);
	};

	onDestroy(() => {
		if (customApplyTimer != null) window.clearTimeout(customApplyTimer);
	});

	const formatTime = (secs: number) => {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	};
</script>

<div class="w-full flex flex-col gap-3 md:gap-4">
	<div class="flex flex-row justify-between gap-2">
		<div class="flex flex-row gap-2 w-full md:w-auto">
			<div class="flex flex-row gap-2">
				<div class="flex flex-col items-center gap-2">
					<select class="px-3 py-2 rounded-md bg-neutral-950/40 ring-1 ring-neutral-800 hover:ring-neutral-600 focus:outline-none" bind:value={selectedDifficulty} on:change={onDifficultyChange}>
						<option value="beginner">{DIFFICULTIES.beginner.label}</option>
						<option value="intermediate">{DIFFICULTIES.intermediate.label}</option>
						<option value="expert">{DIFFICULTIES.expert.label}</option>
						<option value="custom">Custom</option>
					</select>
				</div>
			</div>

			{#if selectedDifficulty === "custom"}
				<div class="flex flex-wrap items-center gap-2">
					<div class="flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-950/40 ring-1 ring-neutral-800">
						<input
							class="w-14 bg-transparent focus:outline-none text-neutral-200 tabular-nums"
							type="number"
							min="5"
							max="40"
							bind:value={customRows}
							on:input={scheduleApplyCustom}
						/>
						<span class="text-neutral-500">×</span>
						<input
							class="w-14 bg-transparent focus:outline-none text-neutral-200 tabular-nums"
							type="number"
							min="5"
							max="60"
							bind:value={customCols}
							on:input={scheduleApplyCustom}
						/>
						<span class="text-neutral-500">•</span>
						<input
							class="w-16 bg-transparent focus:outline-none text-neutral-200 tabular-nums"
							type="number"
							min="1"
							bind:value={customMines}
							on:input={scheduleApplyCustom}
						/>
					</div>

					<button
						type="button"
						on:click={() => startPreset("custom")}
						class="flex flex-row items-center gap-2 px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
					>
						Apply
					</button>
				</div>
			{/if}
		</div>

		<div class="flex flex-wrap gap-2 justify-center md:justify-end items-center">
			<div class="flex items-center gap-2 text-xs text-white/70">
				<div class="flex items-center gap-1 border border-white/10 bg-white/5 rounded-lg py-0.5 px-1.5">
					<Bomb size={14} />
					<span>Mines: </span>
					<span>{ $minesLeft }</span>
				</div>

				<div class="flex items-center gap-1 border border-white/10 bg-white/5 rounded-lg py-0.5 px-1.5">
					<Clock size={14} />
					<span>Time:</span>
					<span>{formatTime($elapsedSeconds)}</span>
				</div>
			</div>
		</div>
	</div>
</div>
