/**
 * Utility for daily rotation of content
 * Ensures the same content is displayed for the entire day
 */

/**
 * Get today's date as a string (YYYY-MM-DD)
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a seeded random number based on a date string
 * This ensures the same index is selected for the same date
 */
function getSeededRandom(dateString, max) {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % max;
}

/**
 * Get a random index from an array, excluding a specific index
 * This is client-side only and uses Math.random()
 * @param arrayLength - The length of the array
 * @param excludeIndex - The index to exclude (to avoid repeats)
 * @returns A random index different from excludeIndex
 */
export function getRandomIndexExcluding(arrayLength, excludeIndex) {
  if (arrayLength <= 1) return 0;
  
  if (excludeIndex === undefined) {
    return Math.floor(Math.random() * arrayLength);
  }
  
  // If there's only one item and it's excluded, return it anyway
  if (arrayLength === 1) return 0;
  
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * arrayLength);
  } while (newIndex === excludeIndex);
  
  return newIndex;
}

/**
 * Get daily content from an array with caching
 * @param array - The array to select from
 * @param cacheKey - The localStorage key for caching
 * @returns The selected content for today
 */
export function getDailyContent(
  array,
  cacheKey
) {
  const today = getTodayDateString();
  
  // Try to get from cache first
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Return cached content if it's from today
        if (parsed.date === today) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
  }
  
  // Select new content based on today's date
  if (!array || array.length === 0) {
    return {
      content: null,
      date: today,
      index: 0,
    };
  }
  
  const index = getSeededRandom(today, array.length);
  const content = array[index];
  
  const result = {
    content,
    date: today,
    index,
  };
  
  // Cache the result
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      // Ignore cache errors
    }
  }
  
  return result;
}

/**
 * Get daily content without caching (for cases where caching is handled elsewhere)
 * @param array - The array to select from
 * @param dateString - Optional date string (defaults to today)
 * @returns The selected content
 */
export function getDailyContentNoCache(
  array,
  dateString
) {
  const date = dateString || getTodayDateString();
  
  if (!array || array.length === 0) {
    return {
      content: null,
      date,
      index: 0,
    };
  }
  
  const index = getSeededRandom(date, array.length);
  
  return {
    content: array[index],
    date,
    index,
  };
}

/**
 * Get a random item from an array, excluding a specific index
 * This is client-side only and uses Math.random()
 * @param array - The array to select from
 * @param excludeIndex - The index to exclude (to avoid repeats)
 * @returns The selected content with its index
 */
export function getRandomContentExcluding(
  array,
  excludeIndex
) {
  const index = getRandomIndexExcluding(array.length, excludeIndex);
  return {
    content: array[index],
    index,
  };
}
