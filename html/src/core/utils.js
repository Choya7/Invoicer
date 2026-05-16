/**
 * Simple Hangul to Roman transliteration for prefix generation
 */
export const romanizeHangulPrefix = (text) => {
  if (!text) return 'XXX';
  
  // Very basic mapping for the first few consonants to get a 3-letter prefix
  const mapping = {
    'ㄱ': 'K', 'ㄴ': 'N', 'ㄷ': 'D', 'ㄹ': 'R', 'ㅁ': 'M', 'ㅂ': 'B', 'ㅅ': 'S',
    'ㅇ': 'O', 'ㅈ': 'J', 'ㅊ': 'C', 'ㅋ': 'K', 'ㅌ': 'T', 'ㅍ': 'P', 'ㅎ': 'H'
  };

  const getFirstConsonant = (char) => {
    const code = char.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return char;
    const firstIdx = Math.floor(code / 588);
    return 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'[firstIdx];
  };

  let result = '';
  for (let i = 0; i < text.length && result.length < 3; i++) {
    const char = text[i];
    if (/[a-zA-Z]/.test(char)) {
      result += char.toUpperCase();
    } else {
      const first = getFirstConsonant(char);
      result += mapping[first] || char[0];
    }
  }

  return result.padEnd(3, 'X').substring(0, 3);
};

/**
 * Generate a consistent 6-digit hash for a given string
 */
export const generateHash6 = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash % 1000000).toString().padStart(6, '0');
};
