import type { AccessToken } from './types';
import { spawn } from 'node:child_process';
import { generateRandomString } from './utils';
import envs from './envs';

/**
 * Request user authorization from Spotify. Returns authorization code on success.
 */
export const login: string = async () => {
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
export const getAccessToken = async (authorizationCode: string) => {
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
export const refreshAccessToken = async (refreshToken: string) => {
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
