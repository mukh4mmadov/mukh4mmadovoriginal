export function mapAdminReadingMetrics(metrics) {
  const daily = Array.isArray(metrics?.daily) ? metrics.daily : [];
  return {
    attempts: daily.map((item) => ({ date: item.date, count: Number(item.attempts) || 0 })),
    readingTime: daily.map((item) => ({ date: item.date, value: Number(item.seconds) || 0, timeValue: true })),
    aiUsage: (Array.isArray(metrics?.ai_usage_daily) ? metrics.ai_usage_daily : []).map((item) => ({
      date: item.date,
      count: Number(item.count) || 0,
    })),
    registrations: (Array.isArray(metrics?.registrations_daily) ? metrics.registrations_daily : []).map((item) => ({
      date: item.date,
      count: Number(item.registrations) || 0,
    })),
    questionTypes: (Array.isArray(metrics?.question_types) ? metrics.question_types : []).map((item) => ({
      type: item.question_type,
      count: Number(item.exposures) || 0,
      accuracy: Number(item.accuracy_percent) || 0,
    })),
  };
}
