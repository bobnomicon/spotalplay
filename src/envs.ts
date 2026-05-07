import 'dotenv/config';
import type { Envs } from './types';

const ENV_KEYS = {
  spotifyClientId: 'SPOTIFY_CLIENT_ID',
  spotifyClientSecret: 'SPOTIFY_CLIENT_SECRET',
  spotifyAccountsUrl: 'SPOTIFY_ACCOUNTS_URL',
  spotifyApiUrl: 'SPOTIFY_API_URL',
  spotifyRedirectUri: 'SPOTIFY_REDIRECT_URI',
  spotifyScope: 'SPOTIFY_SCOPE'
} as const satisfies Record<keyof Envs, string>;

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const loadEnvs = (): Envs => {
  const missingKeys: string[] = [];

  const readEnv = (key: string): string => {
    try {
      return getRequiredEnv(key);
    } catch {
      missingKeys.push(key);
      return '';
    }
  };

  const envs: Envs = {
    spotifyClientId: readEnv(ENV_KEYS.spotifyClientId),
    spotifyClientSecret: readEnv(ENV_KEYS.spotifyClientSecret),
    spotifyAccountsUrl: readEnv(ENV_KEYS.spotifyAccountsUrl),
    spotifyApiUrl: readEnv(ENV_KEYS.spotifyApiUrl),
    spotifyRedirectUri: readEnv(ENV_KEYS.spotifyRedirectUri),
    spotifyScope: readEnv(ENV_KEYS.spotifyScope)
  };

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingKeys.join(', ')}`
    );
  }

  return envs;
};

const envs = loadEnvs();

export default envs;
