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
  id: string;
  name: string;
}

interface Track {
  href: string;
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
  items: TrackItem[]
}

interface AlbumItem {
  id: string;
  name: string;
  tracks: Track;
}

interface Album {
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
  items: { album: AlbumItem }[]
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
    limit,
    offset
  });

  const data: Album[] = await fetch(`${envs.spotifyApiUrl}/me/albums?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${spotifyAccessToken}`
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error(`Error fetching albums: ${response.status} ${response.statusText}`);
    }

    return response.json();
  });

  return data;
};

/**
 * Get tracks for a specific album from Spotify.
 * @param spotifyAccessToken Spotify access token
 * @param albumId Spotify ID of the album
 * @param offset 
 * @param limit 
 * @returns 
 */
const getAlbumTracks = async (spotifyAccessToken: string, albumId: string, offset: number = 0, limit: number = 50) => {
  const queryParams = new URLSearchParams({
    limit,
    offset
  });

  const data: Track[] = await fetch(`${envs.spotifyApiUrl}/albums/${albumId}/tracks?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${spotifyAccessToken}`
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error(`Error fetching album tracks: ${response.status} ${response.statusText}`);
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
      let albums: AlbumItem[] = [];

      let albumData: Album[] = await getUserAlbums(accessToken.access_token, offset, limit);
      albumData?.items?.forEach((album: { album: AlbumItem }) => albums.push(album.album));
      console.log('Total Albums:', albumData?.total);
      
      // Update offset and totalAlbums
      offset += albumData?.items?.length;
      totalAlbums = albumData?.total - albumData?.items?.length;

      // Continue fetching albums until all are retrieved
      // while (totalAlbums > 0) {
      //   console.log('Offset:', offset, 'Albums Left:', totalAlbums);
      //   albumData = await getUserAlbums(accessToken.access_token, offset, limit);
      //   albumData?.items?.forEach((album: { album: AlbumItem }) => albums.push(album.album));

      //   // Update offset and totalAlbums for the next iteration
      //   offset += albumData?.items?.length;
      //   totalAlbums -= albumData?.items?.length;
      // }

      console.log(`Total albums retrieved: ${albums.length}`);

      // Get tracks for each album
      let tracks: TrackItem[] = [];
      for (const album of albums) {
        // Get tracks for the current album
        let offset = 0;
        let limit = 50;
        let totalTracks = 0;

        let trackData: Track[] = await getAlbumTracks(accessToken.access_token, album.id, offset, limit);
        trackData?.items?.forEach((track: TrackItem) => tracks.push({
          id: track.id,
          name: track.name
        }));
        console.log(`Total tracks for album ${album.name}: ${trackData?.total}`);

        // Update offset and totalTracks for the next iteration
        offset += trackData?.items?.length;
        totalTracks = trackData?.total - trackData?.items?.length;

        // Continue fetching tracks until all are retrieved
        while (totalTracks > 0) {
          console.log(`Offset: ${offset}, Tracks Left: ${totalTracks}`);
          trackData = await getAlbumTracks(accessToken.access_token, album.id, offset, limit);
          trackData?.items?.forEach((track: TrackItem) => tracks.push({
            id: track.id,
            name: track.name
          }));

          // Update offset and totalTracks for the next iteration
          offset += trackData?.items?.length;
          totalTracks -= trackData?.items?.length;
        }
      }

      // TODO: Add tracks to playlist
      for (const track of tracks) {
        // Add each track to the playlist
        console.log(track);
      }
    }
  }
};

// Run the app on execution
main();
