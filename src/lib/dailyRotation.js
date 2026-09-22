function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSeededRandom(dateString, max) {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % max;
}

export function getRandomIndexExcluding(arrayLength, excludeIndex) {
  if (arrayLength <= 1) return 0;
  
  if (excludeIndex === undefined) {
    return Math.floor(Math.random() * arrayLength);
  }

  if (arrayLength === 1) return 0;
  
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * arrayLength);
  } while (newIndex === excludeIndex);
  
  return newIndex;
}

export function getDailyContent(
  array,
  cacheKey
) {
  const today = getTodayDateString();

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.date === today) {
          return parsed;
        }
      }
    } catch (e) {
    }
  }

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

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
    }
  }
  
  return result;
}

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
