import readline from 'node:readline/promises';
import type { UserInput } from './types';

const DEFAULT_SPLIT_TRACKS = 11_000;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getAnswer = async (
  question: string,
  valueName: string
): Promise<string> => {
  const answer = await rl.question(question);
  const trimmedAnswer = answer.trim();

  if (!trimmedAnswer) {
    console.log(
      '\n\x1b[31m%s\x1b[0m',
      `${valueName.charAt(0).toUpperCase() + valueName.slice(1)} cannot be empty`
    );
    return getAnswer(question, valueName);
  }

  return trimmedAnswer;
};

const parsePlaylistVisibility = (value: string): boolean =>
  value.toLowerCase() === 'yes';

const parseSplitTracks = (value: string): number => {
  const splitTracks = Number(value);

  if (
    !Number.isInteger(splitTracks) ||
    splitTracks < 1 ||
    splitTracks > DEFAULT_SPLIT_TRACKS
  ) {
    console.log(
      '\n\x1b[33m%s\x1b[0m',
      `Number of tracks out of range. Defaulting to ${DEFAULT_SPLIT_TRACKS}.`
    );
    return DEFAULT_SPLIT_TRACKS;
  }

  return splitTracks;
};

/**
 * Get user input for Spotify username, playlist details, and track splitting preference.
 */
export const getUserInput = async (): Promise<UserInput> => {
  const username = await getAnswer('Enter your Spotify username: ', 'username');
  const playlistName = await getAnswer(
    'Enter the name for the new playlist: ',
    'playlist name'
  );
  const playlistDescription = await getAnswer(
    'Enter the description for the new playlist: ',
    'playlist description'
  );
  const isPublic = await getAnswer(
    'Should the playlist be public? (yes/no): ',
    'public status'
  );
  const splitTracksInput = await getAnswer(
    'Should the tracks exceed the maximum number of tracks per playlist (11000) and need to be split into separate playlists, number of tracks per playlist (must be between 1 and 11000): ',
    'number of tracks'
  );

  rl.close();

  return {
    username,
    playlistName,
    playlistDescription,
    isPublic: parsePlaylistVisibility(isPublic),
    splitTracks: parseSplitTracks(splitTracksInput)
  };
};
