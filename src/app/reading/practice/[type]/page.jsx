import { notFound } from "next/navigation";
import QuestionDrill from "@/components/reading/QuestionDrill";
import { DRILL_TYPES, getDrillType } from "@/lib/reading/question-drills.mjs";

export function generateStaticParams() {
  return DRILL_TYPES.map(({ type }) => ({ type }));
}

export async function generateMetadata({ params }) {
  const { type } = await params;
  const drillType = getDrillType(type);
  if (!drillType) return { title: "Question type not found" };
  return {
    title: `${drillType.label} practice`,
    description: `Practise IELTS Reading ${drillType.label} questions one at a time, each with the paragraph that holds the answer and instant feedback.`,
    alternates: { canonical: `/reading/practice/${type}` },
  };
}

export default async function QuestionDrillPage({ params }) {
  const { type } = await params;
  if (!getDrillType(type)) notFound();
  return <QuestionDrill type={type} />;
}
