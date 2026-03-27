import readline from 'node:readline/promises';
import type { UserInput } from './types';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const _getAnswer = async (question: string, valueName: string) => {
  const answer = await rl.question(question);
  if (!answer.trim()) {
    console.log('\n\x1b[31m%s\x1b[0m', `${valueName.charAt(0).toUpperCase() + valueName.slice(1)} cannot be empty`);
    return _getAnswer(question, valueName);
  }
  return answer.trim();
};

/**
 * Get user input for Spotify username, playlist details, and track splitting preference.
 */
export const getUserInput = async () => {
  // Prompt user for required information
  const username = await _getAnswer('Enter your Spotify username: ', 'username');
  const playlistName = await _getAnswer('Enter the name for the new playlist: ', 'playlist name');
  const playlistDescription = await _getAnswer('Enter the description for the new playlist: ', 'playlist description');
  const isPublic = await _getAnswer('Should the playlist be public? (yes/no): ', 'public status');

  let splitTracks: string | number = await _getAnswer('Should the tracks exceed the maximum number of tracks per playlist (11000) and need to be split into separate playlists, number of tracks per playlist (must be between 1 and 11000): ', 'number of tracks');
  splitTracks = +splitTracks;
  if (splitTracks < 1 || splitTracks > 11000) {
    // Double-check that the number of tracks is within the allowed range, otherwise default to 11000
    console.log('\n\x1b[33m%s\x1b[0m', 'Number of tracks out of range. Defaulting to 11000.');
    splitTracks = 11000;
  }

  // Close the readline interface
  rl.close();

  const userData: UserInput = {
    username,
    playlistName,
    playlistDescription,
    isPublic: isPublic.toLowerCase() === 'yes',
    splitTracks
  };

  return userData;
}
