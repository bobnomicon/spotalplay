import 'dotenv/config';
import type { Envs } from './types';

const envs: Envs = {
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID ?? '',
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? '',
  spotifyAccountsUrl: process.env.SPOTIFY_ACCOUNTS_URL ?? '',
  spotifyApiUrl: process.env.SPOTIFY_API_URL ?? '',
  spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI ?? '',
  spotifyScope: process.env.SPOTIFY_SCOPE ?? ''
};

export default envs;
