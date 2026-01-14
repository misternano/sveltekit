import type { PageServerLoad } from "./$types";
import { env } from "$env/dynamic/private";

export type UpdateItem = {
	date: string;
	title: string;
	description?: string;
	url: string;
	sha: string;
	author: { login: string; avatar_url: string };
};

type GithubUser = { login: string; avatar_url: string };

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
	
	const title = subject.slice("[feature]".length).trimStart();
	if (!title) return null;
	
	const description = lines
		.slice(1)
		.map((l) => l.trim())
		.find((l) => l.length > 0);
	
	return { title, description: description || undefined };
}

function isoToYmd(iso?: string): string {
	return iso ? iso.slice(0, 10) : "0000-00-00";
}

function fallbackAuthor(commit: GithubCommit): UpdateItem["author"] {
	const name =
		commit.commit.author?.name?.trim() ||
		commit.commit.committer?.name?.trim() ||
		"unknown";
	
	return { login: name, avatar_url: "https://github.com/ghost.png" };
}

function isUpdateItem(x: UpdateItem | null): x is UpdateItem {
	return x !== null;
}

async function githubFetch(
	fetchFn: typeof fetch,
	url: string,
	token?: string
): Promise<Response> {
	const baseHeaders: HeadersInit = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
		"User-Agent": "bkclb-arcade"
	};
	
	if (token) {
		const res = await fetchFn(url, {
			headers: { ...baseHeaders, Authorization: `Bearer ${token}` }
		});
		if (res.status !== 403) return res;
		try {
			const body = (await res.clone().json()) as { message?: string };
			const msg = body?.message?.toLowerCase() ?? "";
			const remaining = res.headers.get("x-ratelimit-remaining");
			const isRateLimited = remaining === "0" || msg.includes("rate limit");
			if (isRateLimited) return res;
		} catch {}
	}
	
	return fetchFn(url, { headers: baseHeaders });
}

async function githubErrorDetails(res: Response): Promise<string> {
	const remaining = res.headers.get("x-ratelimit-remaining");
	const limit = res.headers.get("x-ratelimit-limit");
	const reset = res.headers.get("x-ratelimit-reset");
	const reqId = res.headers.get("x-github-request-id");
	
	let msg = "";
	try {
		const body = (await res.clone().json()) as { message?: string; documentation_url?: string };
		if (body?.message) msg += ` message="${body.message}"`;
		if (body?.documentation_url) msg += ` doc="${body.documentation_url}"`;
	} catch {}
	
	const rate =
		remaining !== null
			? ` rate=${remaining}/${limit ?? "?"} reset=${reset ?? "?"}`
			: "";
	
	return `status=${res.status}${msg}${rate} req=${reqId ?? "?"}`;
}

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	setHeaders({
		"cache-control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400"
	});
	
	const token = env.GITHUB_TOKEN?.trim();
	const url = `https://api.github.com/repos/misternano/sveltekit/commits?sha=main&per_page=30`;
	
	const res = await githubFetch(fetch, url, token);
	
	if (!res.ok) {
		console.error(
			`GitHub commits fetch failed (${token ? "token=present" : "token=MISSING"}):`,
			await githubErrorDetails(res)
		);
		
		return { updates: [] as UpdateItem[], updatesError: true };
	}
	
	const commits = (await res.json()) as GithubCommit[];
	
	const updates: UpdateItem[] = commits
		.map((c): UpdateItem | null => {
			const parsed = parseFeatureCommit(c.commit.message);
			if (!parsed) return null;
			
			const dateIso = c.commit.author?.date ?? c.commit.committer?.date;
			
			return {
				sha: c.sha,
				url: c.html_url,
				date: isoToYmd(dateIso),
				title: parsed.title,
				description: parsed.description,
				author:
					c.author?.login && c.author?.avatar_url
						? { login: c.author.login, avatar_url: c.author.avatar_url }
						: fallbackAuthor(c)
			};
		})
		.filter(isUpdateItem)
		.slice(0, 3);
	
	return { updates, updatesError: false };
};
