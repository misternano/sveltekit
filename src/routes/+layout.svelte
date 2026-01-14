<script lang="ts">
	import "../app.css";
	import { Zap, X, Menu, ChevronLeft, ChevronRight, ArrowBigLeft, CircleQuestionMark } from "lucide-svelte";
	import { NavBarGames } from "./components";
	import { page } from "$app/stores";
	import { normalizePathname, syncLastGameFromPath } from "$lib/game";
	import { afterNavigate } from "$app/navigation";
	import { onMount } from "svelte";

	let open = false;
	const close = () => (open = false);
	const toggle = () => (open = !open);

	const STORAGE_KEY = "arcade:menu";
	let collapsed = false;

	const setCollapsed = (value: boolean) => {
		collapsed = value;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ collapsed: value }));
		} catch (_) {
			console.error("[Couldn't mount arcade:menu]: ",_)
		}
	};

	const toggleCollapsed = () => setCollapsed(!collapsed);

	afterNavigate(() => close());

	onMount(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as { collapsed?: boolean };
				if (typeof parsed?.collapsed === "boolean") collapsed = parsed.collapsed;
			}
		} catch (_) {
			console.log("[Couldn't load arcade:menu]: ",_)
		}

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	});

	function cn(...classes: Array<string | false | null | undefined>) {
		return classes.filter(Boolean).join(" ");
	}

	$: syncLastGameFromPath(normalizePathname($page.url.pathname));

	$: sidebarWidth = collapsed ? "4.25rem" : "15.5rem";
</script>

<style>
	@media (min-width: 768px) {
		.layout {
			padding-left: calc(var(--sidebar-w) + 0.75rem);
		}
	}
</style>

<aside
	class={cn(
		"hidden md:flex fixed left-3 top-3 bottom-3 z-50",
		"transition-[width] duration-200 ease-out",
		collapsed ? "w-[4.25rem]" : "w-[15.5rem]"
	)}
	style={`--sidebar-w:${sidebarWidth};`}
	aria-label="Primary navigation"
>
	<div class="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-md shadow-lg ring-1 ring-white/10">
		<div
			class={cn(
				"flex-1 p-2",
				"overflow-y-auto",
				"flex flex-col gap-2",
				"[&_a]:flex [&_a]:items-center [&_a]:gap-3",
				"[&_a]:w-full [&_a]:justify-start",
				"[&_a]:rounded-xl [&_a]:px-3 [&_a]:py-2.5",
				"[&_a]:text-sm [&_a]:font-semibold [&_a]:whitespace-nowrap",
				"[&_a]:transition [&_a]:duration-150 [&_a]:active:scale-[0.98]",
				"[&_a]:!text-slate-100",
				"[&_a]:!bg-slate-950/35 [&_a]:backdrop-blur-md",
				"[&_a]:!ring-1 [&_a]:!ring-indigo-400/30",
				"[&_a:hover]:!bg-indigo-500/20",
				"[&_a:hover]:!ring-indigo-300/60",
				"[&_a:hover]:shadow-lg [&_a:hover]:shadow-indigo-500/20",
				"[&_a:hover]:-translate-y-[1px]",
				"[&_a_svg]:opacity-90 [&_a:hover_svg]:opacity-100",
				"[&_a_svg]:transition [&_a_svg]:duration-150",
				collapsed && "[&_a_span]:hidden"
			)}
		>
			<NavBarGames {collapsed} />
		</div>

		<div class="p-2 pt-0">
			<div class="flex flex-col gap-2">
				<a
					href="/"
					class={cn(
						"group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ecba16] to-amber-500 px-3 py-2 text-sm font-bold text-black shadow-sm transition hover:shadow-md active:scale-[0.98]",
						collapsed && "justify-center px-2"
					)}
				>
					{#if normalizePathname($page.url.pathname) === "/"}
						<Zap size="16" class="fill-black stroke-black transition group-hover:scale-110" />
						<span class={cn("block", collapsed && "hidden")}>BKCLB.dev Arcade</span>
					{:else}
						<ArrowBigLeft size="16" class="fill-black stroke-black transition group-hover:scale-110" />
						<span class={cn("block", collapsed && "hidden")}>Return Home</span>
					{/if}
				</a>

				<div class="flex flex-row gap-2 justify-between items-stretch">
					<button
						type="button"
						on:click={toggleCollapsed}
						class={cn(
						"inline-flex flex-grow items-center gap-2 rounded-xl px-3 py-2",
						"text-slate-200 transition hover:bg-white/10 active:scale-[0.98]",
						collapsed && "justify-center px-2"
					)}
						aria-label={collapsed ? "Expand menu" : "Collapse menu"}
						aria-pressed={collapsed}
					>
						{#if collapsed}
							<ChevronRight size="18" />
							<span class="hidden">Expand</span>
						{:else}
							<ChevronLeft size="18" />
							<span>Collapse</span>
						{/if}
					</button>
					<a
						href="/about"
						class="group inline-flex items-center gap-2 rounded-xl hover:bg-white/10 px-3 text-sm font-bold text-black transition active:scale-[0.98]"
						class:hidden={collapsed}
					>
						<CircleQuestionMark size={20} class="stroke-indigo-500 group-hover:stroke-[#ecba16] group-hover:rotate-6 transition-all" />
					</a>
				</div>
			</div>
		</div>
	</div>
</aside>

<nav class="fixed inset-x-0 top-3 z-50 px-3 sm:px-6 md:hidden">
	<div class="mx-auto max-w-6xl">
		<div class="flex items-center justify-between rounded-2xl bg-white/70 backdrop-blur-md shadow-lg ring-1 ring-black/5 bg-slate-900/60 ring-white/10 px-2 py-2 sm:px-3">
			<a
				href="/"
				class="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ecba16] to-amber-500 px-3 py-2 text-sm font-semibold text-black shadow-sm transition hover:shadow-md active:scale-[0.98]"
				on:click={close}
			>
				{#if normalizePathname($page.url.pathname) === "/"}
					<Zap size="16" class="fill-black stroke-black transition group-hover:scale-110" />
					<span class="hidden sm:block">BKCLB.dev</span>
				{:else}
					<ArrowBigLeft size="16" class="fill-black stroke-black transition group-hover:scale-110" />
					<span class="hidden sm:block">Home</span>
				{/if}
			</a>

			<button
				type="button"
				class="md:hidden inline-flex items-center justify-center rounded-xl px-3 py-2 text-slate-700 transition hover:bg-black/5 active:scale-[0.98] text-slate-200 hover:bg-white/10"
				aria-label={open ? "Close menu" : "Open menu"}
				aria-expanded={open}
				on:click={toggle}
			>
				{#if open}
					<X size="18" />
				{:else}
					<Menu size="18" />
				{/if}
			</button>
		</div>

		{#if open}
			<div class="md:hidden mt-2 rounded-2xl bg-slate-900/70 backdrop-blur-md shadow-lg ring-1 ring-white/10 p-2">
				<button
					class={cn(
						"flex flex-row gap-2",
						"[&_a]:flex [&_a]:items-center [&_a]:justify-between [&_a]:gap-3",
						"[&_a]:rounded-xl [&_a]:px-4 [&_a]:py-3",
						"[&_a]:text-base [&_a]:font-semibold",
						"[&_a]:transition [&_a]:duration-150 [&_a]:active:scale-[0.99]",
						"[&_a:hover]:!bg-indigo-500/20",
						"[&_a:hover]:!ring-indigo-300/60"
					)}
					on:click={close}
				>
					<NavBarGames on:navigate={close} />
				</button>
			</div>
		{/if}
	</div>
</nav>

<div class="layout" style={`--sidebar-w:${sidebarWidth};`}>
	<slot />
</div>
