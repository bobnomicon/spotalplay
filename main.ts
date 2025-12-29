import 'dotenv/config';
import { spawn } from 'node:child_process';

import { generateRandomString } from './utils';

interface Envs {
  spotifyAccountsUrl: string;
  spotifyApiUrl: string;
  spotifyClientId: string;
  spotifyClientSecret: string;
  spotifyRedirectUri: string;
  spotifyScope: string;
}

interface AccessToken {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
}

interface AlbumItem {
  id: string;
  total_tracks: number;
  uri: string;
}

interface Album {
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: AlbumItem[]
}

let envs: Envs;

/**
 * Retrieves the required Spotify environment variables and ensures they are all defined.
 * If any required environment variable is missing, the process will exit with an error.
 */
function getEnvs() {
  envs = {
    spotifyAccountsUrl: process.env.SPOTIFY_ACCOUNTS_URL ?? '',
    spotifyApiUrl: process.env.SPOTIFY_API_URL ?? '',
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID ?? '',
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? '',
    spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI ?? '',
    spotifyScope: process.env.SPOTIFY_SCOPE ?? ''
  };

  let missingEnv = false;
  for (const [key, value] of Object.entries(envs)) {
    if (!value) {
      console.error(`Missing required Spotify environment variable: ${key}`);
      missingEnv = true;
    }
  }
  if (missingEnv) {
    process.exit(1);
  }
}

/**
 * Request user authorization from Spotify. Returns authorization code on success.
 */
const login: string = async () => {
  const queryParams = new URLSearchParams({
    client_id: envs.spotifyClientId,
    response_type: 'code',
    redirect_uri: `${envs.spotifyRedirectUri}/callback`,
    state: generateRandomString(16),
    scope: envs.spotifyScope
  });

  return await fetch(`${envs.spotifyAccountsUrl}/authorize?${queryParams}`)
    .then(async response => {
      if (!response.ok) {
        throw new Error(`Error requesting user authorization: ${response.status} ${response.statusText}`);
      }

      // Open the authorization URL in the user's browser
      // console.log('Opening authorization URL in browser:', response.url);
      const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      const open = spawn(start, [response.url]);

      console.log('Authorization URL opened in browser. Please complete the authorization process.');

      let code = '';
      const fetchAuthorizationCode = async () => {
        return new Promise<void>(async resolve => {
          setTimeout(async () => {
            console.log('Attempting to fetch authorization code from callback URL...');

            const data = await fetch(`${envs.spotifyRedirectUri}/code`).then(response => response.json());
              
            if (data.code) {
              code = data.code;
            }

            resolve();
          }, 3000);
        });
      };

      let maxAttempts = 10;
      while(!code && maxAttempts > 0) {
        await fetchAuthorizationCode();
        maxAttempts--;
      }

      if (!code) {
        throw new Error('Failed to fetch authorization code after maximum attempts.');
      }

      console.log('Authorization code obtained.');
      return code;
    })
    .catch(error => console.error('Error requesting user authorization:', error));
};

/**
 * Gets an access token from the Spotify Accounts service.
 */
const getAccessToken = async (authorizationCode: string) => {
  const credentials = (new Buffer.from(`${envs.spotifyClientId}:${envs.spotifyClientSecret}`).toString('base64'));

  const data: AccessToken = await fetch(`${envs.spotifyAccountsUrl}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: `${envs.spotifyRedirectUri}/callback`
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error fetching access token: ${response.status} ${response.statusText}`);
      }

      console.log('Access token obtained.');
      return response.json();
    })
    .catch(error => console.error('Error fetching access token:', error));

  return data;
};

const getAlbums = async (spotifyAccessToken: string) => {
  const data: Album[] = await fetch(`${envs.spotifyApiUrl}/me/albums`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${envs.spotifyAccessToken}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error fetching albums: ${response.status} ${response.statusText}`);
      }

      return response.json();
    })
    .catch(error => console.error('Error fetching albums:', error));

  return data;
};

/**
 * The main function of the app
 */
const main = async () => {
  // Get environment variables
  getEnvs();

  // Request user authorization from Spotify
  const authorizationCode = await login();
  if (authorizationCode) {
    // Get Spotify access token
    const accessToken = (await getAccessToken(authorizationCode))?.access_token ?? '';
    if (accessToken) {
      // Get user's albums
      const albums = await getAlbums(accessToken);
    }
  }
};

// Run the app on execution
main();
