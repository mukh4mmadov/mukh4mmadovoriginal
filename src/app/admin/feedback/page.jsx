import { redirect } from "next/navigation";

export default function LegacyFeedbackRoute() {
  redirect("/admin/support");
}
