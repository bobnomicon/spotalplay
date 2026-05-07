import { fetchJson } from './api';
import type { AlbumTracksPage, SavedAlbumsPage } from './types';
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
): Promise<SavedAlbumsPage> => {
  const queryParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  });

  return fetchJson<SavedAlbumsPage>(
    `${envs.spotifyApiUrl}/me/albums?${queryParams}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${spotifyAccessToken}`
      }
    },
    'Error fetching albums'
  );
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
): Promise<AlbumTracksPage> => {
  const queryParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  });

  return fetchJson<AlbumTracksPage>(
    `${envs.spotifyApiUrl}/albums/${albumId}/tracks?${queryParams}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${spotifyAccessToken}`
      }
    },
    'Error fetching album tracks'
  );
};
