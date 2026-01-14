import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private"

type GithubRelease = {
	id: number;
	html_url: string;
	name: string | null;
	tag_name: string;
	body: string | null;
	published_at: string | null;
	created_at: string;
};

export type UpdateItem = {
	date: string;
	title: string;
	description?: string;
	url?: string;
};

function toUpdateItem(r: GithubRelease): UpdateItem {
	const iso = (r.published_at ?? r.created_at).slice(0, 10);
	const title = (r.name && r.name.trim()) || r.tag_name;

	const description = (r.body ?? "")
		.split("\n")
		.map((s) => s.trim())
		.find((s) => s.length > 0);

	return {
		date: iso,
		title,
		description: description || undefined,
		url: r.html_url
	};
}

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	setHeaders({
		"cache-control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400"
	});

	const token = env.GITHUB_TOKEN;
	const url = `https://api.github.com/repos/misternano/sveltekit/releases?per_page=5`;

	const res = await fetch(url, {
		headers: {
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			...(token ? { Authorization: `Bearer ${token}` } : {})
		}
	});

	if (!res.ok) {
		throw error(res.status, `Failed to load GitHub releases (${res.status})`);
	}

	const releases = (await res.json()) as GithubRelease[];
	const updates = releases.map(toUpdateItem);

	return { updates };
};
