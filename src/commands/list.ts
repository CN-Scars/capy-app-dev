import { apiRequest, getApiContext } from "../api.ts";
import { CliError } from "../errors.ts";
import { isListAppsResponse } from "../guards.ts";
import { writeJson } from "../json.ts";
import type { AppSummary, ListAppsResponse } from "../types.ts";

const ALL_FLAGS = new Set(["--all", "-a"]);

/**
 * `list` — show the caller's apps. Defaults to active only; `--all`/`-a`
 * includes suspended/deleted rows too. Prints a table for humans, or a JSON
 * envelope under `--json`.
 */
export async function runList(args: string[], json: boolean): Promise<void> {
  let includeAll = false;
  const extra: string[] = [];
  for (const arg of args) {
    if (ALL_FLAGS.has(arg)) {
      includeAll = true;
    } else {
      extra.push(arg);
    }
  }

  if (extra.length > 0) {
    throw new CliError("Usage: capy-app-dev list [--all]", {
      code: "INVALID_USAGE",
      exitCode: 2,
    });
  }

  const api = await getApiContext();
  const pathname = includeAll ? "/api/apps?all=1" : "/api/apps";
  const response = await apiRequest<ListAppsResponse>(api, {
    method: "GET",
    pathname,
  });

  if (!isListAppsResponse(response)) {
    throw new CliError("Unexpected response from list API", {
      code: "INVALID_API_RESPONSE",
    });
  }

  if (json) {
    writeJson({ success: true, apps: response.apps });
    return;
  }

  if (response.apps.length === 0) {
    process.stdout.write(includeAll ? "No apps.\n" : "No active apps.\n");
    return;
  }

  writeHumanTable(response.apps);
}

/** Prints a compact aligned table: NAME  STATUS  URL  LAST-DEPLOYED */
function writeHumanTable(apps: readonly AppSummary[]): void {
  const rows = apps.map((a) => [a.appName, a.status, a.url, a.lastDeployedAt ?? "—"]);
  const header = ["NAME", "STATUS", "URL", "LAST-DEPLOYED"];
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const line = (cells: string[]) =>
    cells
      .map((c, i) => c.padEnd(widths[i]))
      .join("  ")
      .trimEnd();

  process.stdout.write(`${line(header)}\n`);
  for (const row of rows) {
    process.stdout.write(`${line(row)}\n`);
  }
}
