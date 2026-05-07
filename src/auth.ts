import { spawn } from 'node:child_process';
import { fetchJson } from './api';
import type {
  ApiErrorResponse,
  AuthorizationCodeResponse,
  SpotifyAccessToken
} from './types';
import { generateRandomString } from './utils';
import envs from './envs';

/**
 * Request user authorization from Spotify. Returns authorization code on success.
 */
export const login = async (): Promise<string> => {
  const queryParams = new URLSearchParams({
    client_id: envs.spotifyClientId,
    response_type: 'code',
    redirect_uri: `${envs.spotifyRedirectUri}/callback`,
    state: generateRandomString(16),
    scope: envs.spotifyScope,
    show_dialog: 'true'
  });

  const response = await fetch(
    `${envs.spotifyAccountsUrl}/authorize?${queryParams}`
  );

  if (!response.ok) {
    throw new Error(
      `Error requesting user authorization: ${response.status} ${response.statusText}`
    );
  }

  // Open the authorization URL in the user's browser
  const start =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';
  spawn(start, [response.url]);

  console.log(
    'Authorization URL opened in browser. Please complete the authorization process.'
  );

  let code = '';
  const fetchAuthorizationCode = async () => {
    return new Promise<void>(resolve => {
      setTimeout(async () => {
        console.log(
          'Attempting to fetch authorization code from callback URL...'
        );

        const response = await fetch(`${envs.spotifyRedirectUri}/code`);
        if (!response.ok) {
          const error = (await response.json()) as ApiErrorResponse;
          console.log(`${error.message} Retrying.`);
          resolve();
          return;
        }

        const data = (await response.json()) as AuthorizationCodeResponse;
        code = data.code;
        resolve();
      }, 3000);
    });
  };

  let maxAttempts = 20; // Try for up to 1 minute
  while (!code && maxAttempts > 0) {
    await fetchAuthorizationCode();
    maxAttempts--;
  }

  if (!code) {
    throw new Error(
      'Failed to fetch authorization code after maximum attempts.'
    );
  }

  console.log('Authorization code obtained!');
  return code;
};

/**
 * Gets an access token from the Spotify Accounts service.
 */
export const getAccessToken = async (
  authorizationCode: string
): Promise<SpotifyAccessToken> => {
  const credentials = Buffer.from(
    `${envs.spotifyClientId}:${envs.spotifyClientSecret}`
  ).toString('base64');

  const data = await fetchJson<SpotifyAccessToken>(
    `${envs.spotifyAccountsUrl}/api/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: `${envs.spotifyRedirectUri}/callback`
      })
    },
    'Error fetching access token'
  );

  console.log('Access token obtained.');
  return data;
};

/**
 * Refresh access token from the Spotify Accounts service.
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<SpotifyAccessToken> => {
  const credentials = Buffer.from(
    `${envs.spotifyClientId}:${envs.spotifyClientSecret}`
  ).toString('base64');

  const data = await fetchJson<SpotifyAccessToken>(
    `${envs.spotifyAccountsUrl}/api/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: envs.spotifyClientId
      })
    },
    'Error fetching refresh access token'
  );

  console.log('Refresh access token obtained.');
  return data;
};
