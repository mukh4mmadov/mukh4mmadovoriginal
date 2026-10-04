const listeningTests = [
  {
    slug: "study-culture-learning",
    title: "Study, Culture & Learning",
    sectionTitles: ["Student accommodation", "Museum exhibitions", "Pacific tapa cloth", "Adult learner persistence"],
    durationMinutes: 30,
    questionCount: 40,
    audioPath: "/listening/audio/study-culture-learning.m4a",
    audioInsideTest: true,
    testDataPath: "/listening/data/study-culture-learning.gz",
    accent: "sky",
    description: "Four sections with built-in audio controls.",
  },
  {
    slug: "work-drama-food-safety",
    title: "Work, Drama & Food Safety",
    sectionTitles: ["Visiting a farm centre", "Summer vacation jobs", "Voice training for drama students", "Food safety standards"],
    durationMinutes: 35,
    questionCount: 40,
    audioPath: "/listening/audio/work-drama-food-safety.mp3",
    audioInsideTest: false,
    testDataPath: "/listening/data/work-drama-food-safety.gz",
    accent: "violet",
    description: "Listen with the built-in player and review your answers.",
  },
  {
    slug: "campus-art-business",
    title: "Campus, Art & Business",
    sectionTitles: ["Car servicing", "A university society meeting", "The artist Samuel Prout", "A chocolate business decision"],
    durationMinutes: 30,
    questionCount: 40,
    audioPath: "/listening/audio/campus-art-business.mp3",
    audioInsideTest: false,
    testDataPath: "/listening/data/campus-art-business.gz",
    accent: "emerald",
    description: "Form completion, multiple choice, and short-answer tasks.",
  },
  {
    slug: "community-nature-teamwork",
    title: "Community, Nature & Teamwork",
    sectionTitles: ["Community centre programmes", "Royal Nature Park", "Varroa mites and honey bees", "The After Action Review"],
    durationMinutes: 40,
    questionCount: 40,
    audioPath: "/listening/audio/community-nature-teamwork.mp3",
    audioInsideTest: false,
    testDataPath: "/listening/data/community-nature-teamwork.gz",
    accent: "amber",
    description: "A complete four-section listening practice test.",
  },
];

export default listeningTests;

export function getListeningTest(slug) {
  return listeningTests.find((test) => test.slug === slug) || null;
}
