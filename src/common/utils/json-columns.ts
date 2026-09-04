/**
 * SQLite has no scalar lists and no JSON column type, so several fields are
 * stored as text holding JSON: `Case.tags`, `Evidence.metadata` and the
 * `ipAddresses` / `usernames` / `files` / `devices` / `metadata` fields on
 * `TimelineEvent`.
 *
 * These helpers are the only place that knows about that encoding. Everything
 * above them works with real arrays and objects, and the REST payloads are
 * unchanged.
 */

export function decodeStringArray(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.filter((i): i is string => typeof i === 'string');
  if (typeof raw !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    // A row written by hand or by an older schema should not take a whole
    // response down; an empty list is the honest reading of unparseable text.
    return [];
  }
}

export function decodeJsonObject(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export interface TimelineEventRow {
  ipAddresses: string;
  usernames: string;
  files: string;
  devices: string;
  metadata: string | null;
}

export function decodeTimelineEvent<T extends TimelineEventRow>(event: T) {
  return {
    ...event,
    ipAddresses: decodeStringArray(event.ipAddresses),
    usernames: decodeStringArray(event.usernames),
    files: decodeStringArray(event.files),
    devices: decodeStringArray(event.devices),
    metadata: decodeJsonObject(event.metadata),
  };
}

export function decodeEvidence<T extends { metadata: string | null }>(
  evidence: T,
) {
  return { ...evidence, metadata: decodeJsonObject(evidence.metadata) };
}

export function decodeCase<
  T extends {
    tags: string;
    evidence?: Array<{ metadata: string | null }>;
    timelineEvents?: TimelineEventRow[];
  },
>(caseRow: T) {
  return {
    ...caseRow,
    tags: decodeStringArray(caseRow.tags),
    ...(caseRow.evidence && { evidence: caseRow.evidence.map(decodeEvidence) }),
    ...(caseRow.timelineEvents && {
      timelineEvents: caseRow.timelineEvents.map(decodeTimelineEvent),
    }),
  };
}
