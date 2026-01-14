import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

export type UpdateItem = {
	date: string;
	title: string;
	description?: string;
	url: string;
	sha: string;
	author: {
		login: string;
		avatar_url: string;
	};
};

type GithubUser = {
	login: string;
	avatar_url: string;
};

type GithubCommit = {
	sha: string;
	html_url: string;
	author: GithubUser | null;
	commit: {
		message: string;
		author?: { name?: string; email?: string; date?: string };
		committer?: { name?: string; email?: string; date?: string };
	};
};

function parseFeatureCommit(message: string): { title: string; description?: string } | null {
	const lines = message.split("\n");
	const subject = (lines[0] ?? "").trim();
	
	if (!subject.startsWith("[feature]")) return null;
	
	const title = subject.replace(/^\[feature]\s*/, "").trim();
	if (!title) return null;
	
	const description = lines
		.slice(1)
		.map((l) => l.trim())
		.find((l) => l.length > 0);
	
	return { title, description: description || undefined };
}

function isoToYmd(iso?: string): string {
	if (!iso) return "0000-00-00";
	return iso.slice(0, 10);
}

function fallbackAuthor(commit: GithubCommit): UpdateItem["author"] {
	const name =
		commit.commit.author?.name?.trim() ||
		commit.commit.committer?.name?.trim() ||
		"unknown";
	
	return {
		login: name,
		avatar_url: "https://github.com/ghost.png"
	};
}

function isUpdateItem(x: UpdateItem | null): x is UpdateItem {
	return x !== null;
}

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	setHeaders({
		"cache-control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400"
	});
	
	const token = env.GITHUB_TOKEN;
	
	const url = `https://api.github.com/repos/misternano/sveltekit/commits?sha=main&per_page=30`;
	const res = await fetch(url, {
		headers: {
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			...(token ? { Authorization: `Bearer ${token}` } : {})
		}
	});
	
	if (!res.ok) throw error(res.status, `Failed to load GitHub commits (${res.status})`);
	
	const commits = (await res.json()) as GithubCommit[];
	
	const updates: UpdateItem[] = commits
		.map((c): UpdateItem | null => {
			const parsed = parseFeatureCommit(c.commit.message);
			if (!parsed) return null;
			
			const dateIso = c.commit.author?.date ?? c.commit.committer?.date;
			
			const author =
				c.author?.login && c.author?.avatar_url
					? { login: c.author.login, avatar_url: c.author.avatar_url }
					: fallbackAuthor(c);
			
			return {
				sha: c.sha,
				url: c.html_url,
				date: isoToYmd(dateIso),
				title: parsed.title,
				description: parsed.description,
				author
			};
		})
		.filter(isUpdateItem)
		.slice(0, 3);
	
	return { updates };
};
