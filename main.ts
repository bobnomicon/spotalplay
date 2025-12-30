import 'dotenv/config';
import { spawn } from 'node:child_process';

import { generateRandomString } from './utils';

interface Envs {
  spotifyClientId: string;
  spotifyClientSecret: string;
  spotifyAccountsUrl: string;
  spotifyApiUrl: string;
  spotifyRedirectUri: string;
  spotifyScope: string;
}

interface AccessToken {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

interface TrackItem {
  href: string;
  id: string;
  name: string;
  track_number: number;
  uri: string;
}

interface AlbumItem {
  added_at: string;
  album: {
    total_tracks: number;
    href: string;
    id: string;
    name: string;
    uri: string;
    tracks: {
      href: string;
      limit: number;
      next?: string;
      offset: number;
      previous?: string;
      total: number;
      items: TrackItem[]
    }
  }
}

interface Album {
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
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
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID ?? '',
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? '',
    spotifyAccountsUrl: process.env.SPOTIFY_ACCOUNTS_URL ?? '',
    spotifyApiUrl: process.env.SPOTIFY_API_URL ?? '',
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
    });
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

      return response.json();
    });

  console.log('Access token obtained.');
  return data;
};

/**
 * Refresh access token from the Spotify Accounts service.
 */
const refreshAccessToken = async (refreshToken: string) => {
  const credentials = (new Buffer.from(`${envs.spotifyClientId}:${envs.spotifyClientSecret}`).toString('base64'));

  const data: AccessToken = await fetch(`${envs.spotifyAccountsUrl}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: envs.spotifyClientId
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error fetching refresh access token: ${response.status} ${response.statusText}`);
      }

      return response.json();
    });

  console.log('Refresh access token obtained.');
  return data;
};

/**
 * Get user's saved albums from Spotify.
 * @param spotifyAccessToken Spotify access token
 * @param offset 
 * @param limit 
 * @returns 
 */
const getUserAlbums = async (spotifyAccessToken: string, offset: number = 0, limit: number = 50) => {
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });

  const data: Album[] = await fetch(`${envs.spotifyApiUrl}/me/albums?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${spotifyAccessToken}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error fetching albums: ${response.status} ${response.statusText}`);
      }

      return response.json();
    });

  return data;
};

/**
 * The main function of the app.
 */
const main = async () => {
  // Get environment variables
  getEnvs();

  // Request user authorization from Spotify
  const authorizationCode = await login();
  if (authorizationCode) {
    // Get Spotify access token
    let accessToken = await getAccessToken(authorizationCode);

    if (accessToken?.access_token) {
      // Get user's albums
      let offset = 0;
      let limit = 50;
      let totalAlbums = 0;
      let albums: Album[] = [];

      let albumData: Album[];
      albumData = await getUserAlbums(accessToken?.access_token, 50, 0);
      albumData?.items?.forEach(album => albums.push(album.));
      
      offset += albumData?.items?.length || 0;
      totalAlbums = albums?.total - (albums?.items?.length || 0) || 0;
      while (totalAlbums > 0) {
        // Continue fetching albums until all are retrieved
        albumData = await getUserAlbums(accessToken?.access_token, limit, offset);
        albumData?.items?.forEach(album => albums.push(album));

        offset += albumData?.items?.length || 0;
        totalAlbums -= albums?.items?.length || 0;
      }

      console.log(`Total albums retrieved: ${albums.length}`);

      // TODO: Get tracks for each album

      // TODO: Add tracks to playlist
    }
  }
};

// Run the app on execution
main();
