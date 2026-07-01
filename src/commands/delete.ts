import { apiRequest, getApiContext } from "../api.ts";
import { readProjectConfig } from "../config.ts";
import { CliError } from "../errors.ts";
import { isDeleteResponse } from "../guards.ts";
import { writeJson } from "../json.ts";
import type { DeleteResponse } from "../types.ts";

/**
 * Delete the current project's app (soft-delete on the platform: the worker and
 * routing are removed so it stops serving; the registry row is kept and D1 data
 * is preserved). Destructive, so it requires an explicit `--yes`/`-y` confirmation
 * — the CLI is agent-driven and non-interactive, so there is no TTY prompt.
 */
export async function runDelete(args: string[], json: boolean): Promise<void> {
  const confirmFlags = new Set(["--yes", "-y"]);
  const positional = args.filter((arg) => !confirmFlags.has(arg));
  const confirmed = args.some((arg) => confirmFlags.has(arg));

  if (positional.length > 0) {
    throw new CliError("Usage: capy-app-dev delete [--yes]", {
      code: "INVALID_USAGE",
      exitCode: 2,
    });
  }

  const config = await readProjectConfig(process.cwd());

  if (!confirmed) {
    throw new CliError(
      `This permanently stops "${config.appName}" and removes its URL. ` +
        "Re-run with --yes to confirm.",
      { code: "CONFIRMATION_REQUIRED", exitCode: 2 },
    );
  }

  const api = await getApiContext();
  const response = await apiRequest<DeleteResponse>(api, {
    method: "DELETE",
    pathname: `/api/apps/${encodeURIComponent(config.appName)}`,
  });

  if (!isDeleteResponse(response)) {
    throw new CliError("Unexpected response from delete API", {
      code: "INVALID_API_RESPONSE",
    });
  }

  if (json) {
    writeJson({
      success: true,
      appName: response.appName,
      status: response.status,
    });
    return;
  }

  process.stdout.write(`Deleted app "${response.appName}" (status: ${response.status})\n`);
  process.stdout.write(
    "Note: .capy-app.json still references this app; remove it if you no longer need the link.\n",
  );
}
