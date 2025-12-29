/**
 * Generate a pseudo-random string of the specified length (NOT cryptographically secure)
 * @param number length 
 * @returns string 
 */
function generateRandomString(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export {
  generateRandomString
};
