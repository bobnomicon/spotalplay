import 'dotenv/config';

const spotifyAccountsUrl = process.env.SPOTIFY_ACCOUNTS_URL;
const spotifyApiUrl = process.env.SPOTIFY_API_URL;
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

interface AccessToken {
  access_token: string;
  token_type: string;
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

/**
 * Gets an access token from the Spotify Accounts service
 */
const getAccessToken = async () => {
  const response: AccessToken = await fetch(`${spotifyAccountsUrl}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: spotifyClientId,
      client_secret: spotifyClientSecret
    })
  })
    .then(response => response.json())
    .catch(error => console.error('Error fetching access token:', error));

  return response;
}

const getAlbums = async (spotifyAccessToken: string) => {
  const albums: Album[] = await fetch(`${spotifyApiUrl}/me/albums`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${spotifyAccessToken}`
    }
  })
    .then(response => response.json())
    .catch(error => console.error('Error fetching albums:', error));

  return albums;
}

/**
 * The main function of the app
 */
const main = async () => {
  const spotifyAcessToken = (await getAccessToken())?.access_token ?? '';
  if (spotifyAcessToken) {
    const albums = await getAlbums(spotifyAcessToken);
    console.log(albums);
  }
}

// Run the app on execution
main();
