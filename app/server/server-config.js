const DEFAULT_PORT = 3000;

function resolveHostname(env = process.env) {
  const isProductionLike = env.NODE_ENV === 'production' || Boolean(env.IISNODE_VERSION);
  return isProductionLike ? '0.0.0.0' : 'localhost';
}

function resolvePort(env = process.env) {
  const configuredPort = Number(env.PORT || DEFAULT_PORT);
  return Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : DEFAULT_PORT;
}

module.exports = {
  resolveHostname,
  resolvePort,
};
