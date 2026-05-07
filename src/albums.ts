import type { Album, Track } from './types';
import envs from './envs';

/**
 * Get user's saved albums from Spotify.
 * @param spotifyAccessToken Spotify access token
 * @param offset
 * @param limit
 * @returns
 */
export const getAlbums = async (
  spotifyAccessToken: string,
  offset: number = 0,
  limit: number = 50
) => {
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  }) as URLSearchParams;

  const data = (await fetch(`${envs.spotifyApiUrl}/me/albums?${queryParams}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${spotifyAccessToken}`
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error(
        `Error fetching albums: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  })) as Album;

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
export const getAlbumTracks = async (
  spotifyAccessToken: string,
  albumId: string,
  offset: number = 0,
  limit: number = 50
) => {
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });

  const data = (await fetch(
    `${envs.spotifyApiUrl}/albums/${albumId}/tracks?${queryParams}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${spotifyAccessToken}`
      }
    }
  ).then(response => {
    if (!response.ok) {
      throw new Error(
        `Error fetching album tracks: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  })) as Track;

  return data;
};
