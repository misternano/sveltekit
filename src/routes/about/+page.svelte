<script lang="ts">
	import { tick } from "svelte";
	import { ShieldQuestionMark } from "lucide-svelte";

	const faqs: Array<{ q: string; a: string }> = [
		{
			q: "Do you track me or use ads?",
			a: "No ads, no analytics trackers, no accounts. The site is built for quiet, focused play."
		},
		{
			q: "What is BKCLB Arcade?",
			a: "A small collection of minimal arcade-style games that load fast and stay out of your way."
		},
		{
			q: "When will X game get added?",
			a: "Send me an email at arcade@bkclb.dev with suggestions."
		},
		{
			q: "Do you have leaderboards?",
			a: "No. The goal is low-pressure play. If a game stores anything, it stays on your device."
		},
		{
			q: "How does the Daily Challenge work?",
			a: "Each day highlights a different game. It's meant as a quick suggestion, not a competitive event."
		},
		{
			q: "Why don't some games remember my progress?",
			a: "Game's data is stored in locally in your browser, switching devices or clearing your cookies can cause this."
		},
		{
			q: "Can I request a game or report a bug?",
			a: "Yes. Share feedback via the repo/issues if you have them, or send me an email at arcade@bkclb.dev with what you'd like to see."
		},
		{
			q: "Can I contribute to the project?",
			a: "Yes, you can submit fixes or features through the repo's contribute branch. Follow the instructions there."
		}
	];

	let openedIndex: number | null = null;
	let faqSectionEl: HTMLElement | null = null;

	const openFaqByQuestion = async (question: string) => {
		const idx = faqs.findIndex((f) => f.q === question);
		if (idx === -1) return;

		openedIndex = idx;

		await tick();
		faqSectionEl?.scrollIntoView({ behavior: "smooth", block: "start" });
	};
</script>

<main class="max-w-[90vw] mx-auto min-h-screen flex flex-col items-center mt-20 md:mt-16 mb-6">
	<section class="relative w-full max-w-3xl">
		<div class="hidden xl:block absolute -left-52 -z-10 rounded-full p-5 bg-black/10 border border-neutral-800 hover:border-indigo-500/40 hover:bg-neutral-900/80 transition-all group">
			<ShieldQuestionMark size={150} class="stroke-indigo-500 -rotate-12 opacity-80 group-hover:opacity-100 transition-opacity" />
		</div>

		<p class="text-indigo-300 uppercase tracking-[0.25em] text-xs mb-3">About</p>
		<h1
			class="font-impact text-5xl sm:text-6xl tracking-wide bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent"
		>
			BKCLB Arcade
		</h1>
		<p class="mt-4 text-neutral-400 text-sm sm:text-base leading-relaxed">
			BKCLB Arcade is a tiny arcade cabinet on the web: quick-loading games, clean UI, and nothing
			competing for your attention.
		</p>
		<div class="my-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:p-5">
			<div class="flex items-start gap-3">
				<ShieldQuestionMark size={20} class="stroke-indigo-300 mt-0.5" />
				<div class="min-w-0">
					<p class="text-neutral-200 text-sm font-semibold">Privacy-first by default</p>
					<p class="text-neutral-500 text-sm leading-relaxed">
						No accounts, no ads, no trackers. If anything is saved, it stay on your device.
					</p>
					<button
						type="button"
						class="mt-3 text-indigo-300 hover:text-indigo-200 text-xs uppercase tracking-[0.25em] transition-colors"
						on:click={() => openFaqByQuestion("Do you track me or use ads?")}
					>
						Read the FAQ →
					</button>
				</div>
			</div>
		</div>

		<div
			bind:this={faqSectionEl}
			class="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 sm:p-8"
		>
			<div class="mb-6 flex items-center justify-between gap-4">
				<h2 class="text-neutral-200 text-lg font-semibold flex items-center gap-2">
					Frequently Asked Questions
				</h2>
				<button
					type="button"
					class="text-neutral-600 hover:text-neutral-300 text-xs uppercase tracking-[0.25em] transition-colors"
					on:click={() => openFaqByQuestion("Do you track me or use ads?")}
				>
					Privacy
				</button>
			</div>
			<div class="flex flex-col gap-3">
				{#each faqs as item, i (item.q)}
					<details
						class="rounded-xl border border-neutral-800 bg-neutral-950/30 px-4 py-3"
						open={openedIndex === i}
					>
						<summary
							class="cursor-pointer select-none text-neutral-200"
							on:click|preventDefault={() => {
								openedIndex = openedIndex === i ? null : i;
							}}
						>
							{item.q}
						</summary>
						<p class="mt-3 text-neutral-500 text-sm leading-relaxed">{item.a}</p>
					</details>
				{/each}
			</div>
		</div>
		<p class="mt-6 text-center text-neutral-700 text-xs">
			BKCLB Arcade · Built for quiet, focused play
		</p>
	</section>
</main>
