import { redirect } from "next/navigation";

// Sign-in uses Google only, so there is no password to reset. Keep old links
// working by sending them to the sign-in page.
export default function ForgotPasswordPage() {
  redirect("/login");
}
