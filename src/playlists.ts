import { fetchJson } from './api';
import type { SpotifyPlaylist } from './types';
import envs from './envs';

// 2/26 - [REMOVED] Create Playlist for user (POST /users/{user_id}/playlists) - Create a playlist for a Spotify user. Use POST /me/playlists instead
/**
 * Creates a new playlist for the user on Spotify.
 * @param spotifyAccessToken Spotify access token
 * @param name
 * @param description
 * @param isPublic
 */
export const createPlaylist = async (
  spotifyAccessToken: string,
  userId: string,
  name: string,
  description: string,
  isPublic: boolean = false
): Promise<SpotifyPlaylist> => {
  const requestBody = {
    name,
    description,
    public: isPublic
  };

  const data = await fetchJson<SpotifyPlaylist>(
    `${envs.spotifyApiUrl}/users/${userId}/playlists`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${spotifyAccessToken}`
      },
      body: JSON.stringify(requestBody)
    },
    'Error creating playlist'
  );

  console.log(`Playlist '${data.name}' created successfully.`);
  return data;
};

// 2/26 - [REMOVED] Add Items to Playlist (POST /playlists/{id}/tracks) – Adds tracks or episodes to a playlist. Use POST /playlists/{id}/items instead
export const addTracksToPlaylist = async (
  spotifyAccessToken: string,
  playlistId: string,
  uris: string[]
): Promise<void> => {
  await fetchJson<{ snapshot_id: string }>(
    `${envs.spotifyApiUrl}/playlists/${playlistId}/tracks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${spotifyAccessToken}`
      },
      body: JSON.stringify({ uris })
    },
    'Error adding tracks to playlist'
  );
};
