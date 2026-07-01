export interface ProjectConfig {
  appName: string;
  url: string;
  createdAt?: string;
  /**
   * Plain (non-secret) environment variables to inject into the deployed worker
   * as Cloudflare `vars`. String values only — CF worker `vars` are strings, and
   * these are plain text (visible in the dashboard), so secrets must NOT go here.
   */
  env?: Record<string, string>;
}

export interface DeploymentInfo {
  appName: string;
  url: string;
  version: string;
  assetsCount: number;
  deployedAt: string;
  database?: DeploymentDatabaseInfo;
}

export interface DeploymentDatabaseInfo {
  id: string;
  name: string;
  migrationsApplied: number;
}

export interface AppStatusResponse {
  success: true;
  app: {
    appName: string;
    userId: string;
    workerName: string;
    url: string;
    createdAt: string;
    deployment: DeploymentInfo | null;
    database: AppDatabaseInfo | null;
  };
}

export interface AppDatabaseInfo {
  id: string;
  name: string;
}

export interface CreateAppResponse {
  success: true;
  app: {
    appName: string;
    url: string;
    createdAt: string;
  };
}

export interface DeployResponse {
  success: true;
  deployment: DeploymentInfo;
}

export interface DeleteResponse {
  success: true;
  appName: string;
  status: string;
}

export interface SandboxIdentityResponse {
  valid: boolean;
  user_id?: string;
  sandbox_id?: string;
  issued_at?: string;
}

export interface SandboxIdentity {
  userId: string;
  sandboxId: string;
  issuedAt?: string;
  token: string;
}

/**
 * A Cloudflare `plain_text` binding — the metadata shape the platform's deploy
 * backend forwards to the Workers API to expose a plain (non-secret) env var to
 * the user worker at runtime (`env.<name>`).
 */
export interface PlainTextBinding {
  type: "plain_text";
  name: string;
  text: string;
}

/**
 * The `config` field uploaded alongside the deploy archive. The backend reads
 * `config.bindings` and merges it into the worker's deploy metadata. Only the
 * fields the CLI produces are modeled here.
 */
export interface DeployConfig {
  bindings: PlainTextBinding[];
}

export interface DeployManifest {
  worker?: {
    entry: string;
    modules?: string[];
  };
  assets?: {
    directory: string;
  };
  database?: {
    migrations: string;
  };
}

export interface DeployPackageResult {
  archivePath: string;
  archiveName: string;
  tempRoot: string;
  workerEntry: string | null;
  assetsDirectory: string | null;
  assetsCount: number;
  databaseMigrationsDirectory: string | null;
  databaseMigrationFiles: number;
}

export interface ScaffoldSource {
  root: string;
  label: string;
  cleanup?: () => Promise<void>;
}

/**
 * Result of `parseJson`. A discriminated union so a successfully parsed `null`
 * body (`{ ok: true, value: null }`) is distinguishable from a parse failure
 * (`{ ok: false }`) — previously both collapsed to `null`.
 */
export type JsonParseResult = { ok: true; value: unknown } | { ok: false };
