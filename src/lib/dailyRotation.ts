/**
 * Utility for daily rotation of content
 * Ensures the same content is displayed for the entire day
 */

export interface DailyContent<T> {
  content: T;
  date: string;
  index: number;
}

/**
 * Get today's date as a string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
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
function getSeededRandom(dateString: string, max: number): number {
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
export function getRandomIndexExcluding(arrayLength: number, excludeIndex?: number): number {
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
export function getDailyContent<T>(
  array: T[],
  cacheKey: string
): DailyContent<T> {
  const today = getTodayDateString();
  
  // Try to get from cache first
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as DailyContent<T>;
        // Return cached content if it's from today
        if (parsed.date === today) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Failed to read daily content cache "${cacheKey}":`, e);
    }
  }
  
  // Select new content based on today's date
  const index = getSeededRandom(today, array.length);
  const content = array[index];
  
  const result: DailyContent<T> = {
    content,
    date: today,
    index,
  };
  
  // Cache the result
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      console.warn(`Failed to write daily content cache "${cacheKey}":`, e);
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
export function getDailyContentNoCache<T>(
  array: T[],
  dateString?: string
): DailyContent<T> {
  const date = dateString || getTodayDateString();
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
export function getRandomContentExcluding<T>(
  array: T[],
  excludeIndex?: number
): { content: T; index: number } {
  const index = getRandomIndexExcluding(array.length, excludeIndex);
  return {
    content: array[index],
    index,
  };
}
