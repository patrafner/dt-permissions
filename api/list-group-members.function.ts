import { createAccountClient } from "./lib/accountApi";

interface RawUserSlim {
  uid: string;
  email: string;
  name?: string;
  surname?: string;
  userStatus?: string;
  type?: string;
}
interface RawUserDetail extends RawUserSlim {
  groups?: { uuid: string }[];
}
interface RawUserList {
  items?: RawUserSlim[];
  nextPageKey?: string;
}

const MAX_PAGES = 20;
const CONCURRENCY = 6;

async function mapLimit<T, U>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<U>,
): Promise<U[]> {
  const results: U[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = await Promise.all(items.slice(i, i + limit).map(fn));
    results.push(...batch);
  }
  return results;
}

/**
 * Users that belong to a specific group UUID.
 * Fetches the slim user list first, then fetches detail for each user
 * (in batches of CONCURRENCY) to read their group memberships.
 */
export default async function ({ groupUuid }: { groupUuid: string }) {
  if (!groupUuid || !/^[0-9a-f-]{8,64}$/i.test(groupUuid)) {
    throw new Error("Invalid groupUuid");
  }

  const api = await createAccountClient();
  const base = `/iam/v1/accounts/${encodeURIComponent(api.accountUuid)}/users`;

  const slim: RawUserSlim[] = [];
  let query = "";
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await api.get<RawUserList | RawUserSlim[]>(base + query);
    const list = Array.isArray(res) ? res : (res.items ?? []);
    slim.push(...list);
    const next = Array.isArray(res) ? undefined : res.nextPageKey;
    if (!next) break;
    query = `?page-key=${encodeURIComponent(next)}`;
  }

  const eligible = slim.filter((u) => u.email && u.type !== "SERVICE");

  const details = await mapLimit(eligible, CONCURRENCY, async (u) => {
    try {
      return await api.get<RawUserDetail>(
        `${base}/${encodeURIComponent(u.email)}`,
      );
    } catch {
      return u as RawUserDetail;
    }
  });

  const members = details
    .filter((u) => u.groups?.some((g) => g.uuid === groupUuid))
    .map((u) => ({
      uid: u.uid,
      email: u.email,
      name: u.name ?? "",
      surname: u.surname ?? "",
      status: u.userStatus ?? "",
    }))
    .sort((a, b) =>
      `${a.surname} ${a.name}`.localeCompare(`${b.surname} ${b.name}`),
    );

  return { members };
}
