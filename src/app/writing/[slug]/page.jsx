import { notFound } from "next/navigation";
import writingTasks, { getWritingTask } from "@/data/writingTasks";
import WritingEditor from "@/components/writing/WritingEditor";

export function generateStaticParams() {
  return writingTasks.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const task = getWritingTask(slug);
  if (!task) return { title: "Writing Task Not Found" };
  const description = `IELTS Academic Writing Task ${task.task} practice (${task.type}): ${task.prompt}`.slice(0, 300);
  return {
    title: `${task.title} (Writing Task ${task.task})`,
    description,
    alternates: { canonical: `/writing/${task.slug}` },
    openGraph: { title: `${task.title} | IELTS Writing Task ${task.task}`, description, url: `/writing/${task.slug}` },
  };
}

export default async function WritingTaskPage({ params }) {
  const { slug } = await params;
  const task = getWritingTask(slug);
  if (!task) notFound();
  return <WritingEditor task={task} />;
}
