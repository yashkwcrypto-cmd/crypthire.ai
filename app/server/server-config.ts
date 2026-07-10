const DEFAULT_PORT = 3000;

export function resolveHostname(env: NodeJS.ProcessEnv = process.env) {
  const isProductionLike = env.NODE_ENV === "production" || Boolean(env.IISNODE_VERSION);
  return isProductionLike ? "0.0.0.0" : "localhost";
}

export function resolvePort(env: NodeJS.ProcessEnv = process.env) {
  const configuredPort = Number(env.PORT || DEFAULT_PORT);
  return Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : DEFAULT_PORT;
}
