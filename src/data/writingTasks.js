// Original IELTS Academic Writing practice tasks. Task 1 charts are drawn
// from the data below (see components/writing/WritingChart.jsx), and the same
// data is given to the AI examiner as text.

const TASK_1_INSTRUCTIONS = "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.";
const TASK_2_INSTRUCTIONS = "Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.";

const writingTasks = [
  {
    slug: "household-internet-access",
    task: 1,
    type: "Bar chart",
    title: "Household internet access",
    prompt: "The chart below shows the percentage of households with internet access in four countries in 2005, 2015 and 2025.",
    instructions: TASK_1_INSTRUCTIONS,
    chart: {
      kind: "bar",
      unit: "%",
      max: 100,
      categories: ["Uzbekistan", "Brazil", "Germany", "Japan"],
      series: [
        { name: "2005", values: [6, 21, 62, 57] },
        { name: "2015", values: [38, 51, 85, 81] },
        { name: "2025", values: [81, 84, 95, 93] },
      ],
    },
  },
  {
    slug: "museum-visitors",
    task: 1,
    type: "Line graph",
    title: "Visitors to three museums",
    prompt: "The graph below shows the number of visitors, in millions, to three museums in one city between 2014 and 2024.",
    instructions: TASK_1_INSTRUCTIONS,
    chart: {
      kind: "line",
      unit: "million",
      max: 5,
      categories: ["2014", "2016", "2018", "2020", "2022", "2024"],
      series: [
        { name: "Science Museum", values: [3.2, 3.6, 4.1, 1.1, 3.4, 4.6] },
        { name: "History Museum", values: [2.6, 2.5, 2.4, 0.8, 1.9, 2.2] },
        { name: "Art Gallery", values: [1.0, 1.4, 1.9, 0.6, 2.3, 3.0] },
      ],
    },
  },
  {
    slug: "household-spending",
    task: 1,
    type: "Pie charts",
    title: "Household spending in 2004 and 2024",
    prompt: "The pie charts below show how the average household in one country spent its budget in 2004 and 2024.",
    instructions: TASK_1_INSTRUCTIONS,
    chart: {
      kind: "pie",
      unit: "%",
      labels: ["Housing", "Food", "Transport", "Leisure", "Other"],
      pies: [
        { name: "2004", values: [24, 31, 14, 9, 22] },
        { name: "2024", values: [35, 22, 16, 15, 12] },
      ],
    },
  },
  {
    slug: "daily-water-use",
    task: 1,
    type: "Table",
    title: "Daily water use per person",
    prompt: "The table below shows the average daily water use per person, in litres, in five cities in 2010 and 2020.",
    instructions: TASK_1_INSTRUCTIONS,
    chart: {
      kind: "table",
      unit: "litres per person per day",
      columns: ["City", "2010", "2020"],
      rows: [
        ["Tashkent", 310, 265],
        ["Dubai", 500, 470],
        ["London", 160, 141],
        ["Singapore", 152, 141],
        ["Cape Town", 225, 103],
      ],
    },
  },
  {
    slug: "glass-recycling-process",
    task: 1,
    type: "Process diagram",
    title: "How glass bottles are recycled",
    prompt: "The diagram below shows the process of recycling used glass bottles into new bottles.",
    instructions: TASK_1_INSTRUCTIONS,
    chart: {
      kind: "process",
      steps: [
        "Bottles are left at collection points",
        "Trucks take them to a recycling plant",
        "Bottles are sorted by colour",
        "Glass is washed and labels removed",
        "Glass is crushed into small pieces (cullet)",
        "Cullet is melted at 1,500°C",
        "Molten glass is shaped into new bottles",
        "New bottles are filled and sent to shops",
      ],
    },
  },
  {
    slug: "free-university-education",
    task: 2,
    type: "Opinion",
    title: "Free university education",
    prompt: "Some people believe that university education should be free for every student, paid for by the government. To what extent do you agree or disagree?",
    instructions: TASK_2_INSTRUCTIONS,
  },
  {
    slug: "school-starting-age",
    task: 2,
    type: "Discuss both views",
    title: "When children should start school",
    prompt: "Some people think children should start formal school as early as possible, while others believe they should not begin until the age of seven or later. Discuss both views and give your own opinion.",
    instructions: TASK_2_INSTRUCTIONS,
  },
  {
    slug: "city-traffic-congestion",
    task: 2,
    type: "Problem and solution",
    title: "Traffic congestion in cities",
    prompt: "Traffic congestion is becoming a serious problem in many large cities. What are the main causes of this problem, and what measures could be taken to reduce it?",
    instructions: TASK_2_INSTRUCTIONS,
  },
  {
    slug: "working-from-home",
    task: 2,
    type: "Advantages and disadvantages",
    title: "Working from home",
    prompt: "More and more people are now able to work from home instead of travelling to an office. Do the advantages of this development outweigh the disadvantages?",
    instructions: TASK_2_INSTRUCTIONS,
  },
  {
    slug: "young-people-social-media",
    task: 2,
    type: "Two-part question",
    title: "Young people and social media",
    prompt: "Many young people now spend several hours a day on social media. Why is this the case? Is this a positive or a negative development?",
    instructions: TASK_2_INSTRUCTIONS,
  },
  {
    slug: "public-transport-or-roads",
    task: 2,
    type: "Opinion",
    title: "Public transport or new roads",
    prompt: "Governments should spend money on improving public transport rather than on building new roads. To what extent do you agree or disagree?",
    instructions: TASK_2_INSTRUCTIONS,
  },
];

export const WRITING_TASK_RULES = {
  1: { minWords: 150, maxWords: 600, minutes: 20, criteria: ["Task Achievement", "Coherence and Cohesion", "Lexical Resource", "Grammatical Range and Accuracy"] },
  2: { minWords: 250, maxWords: 1000, minutes: 40, criteria: ["Task Response", "Coherence and Cohesion", "Lexical Resource", "Grammatical Range and Accuracy"] },
};

export function getWritingTask(slug) {
  return writingTasks.find((task) => task.slug === slug) || null;
}

// Plain-text version of a Task 1 visual, for the AI examiner and screen readers.
export function describeWritingChart(chart) {
  if (!chart) return "";
  switch (chart.kind) {
    case "bar":
    case "line":
      return chart.series.map((series) => `${series.name}: ${chart.categories.map((category, index) => `${category} ${series.values[index]}${chart.unit === "%" ? "%" : ` ${chart.unit}`}`).join(", ")}`).join("\n");
    case "pie":
      return chart.pies.map((pie) => `${pie.name}: ${chart.labels.map((label, index) => `${label} ${pie.values[index]}%`).join(", ")}`).join("\n");
    case "table":
      return [`(${chart.unit})`, chart.columns.join(" | "), ...chart.rows.map((row) => row.join(" | "))].join("\n");
    case "process":
      return chart.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
    default:
      return "";
  }
}

export function countWords(text) {
  const trimmed = String(text || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export default writingTasks;
