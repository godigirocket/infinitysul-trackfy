import { redirect } from "next/navigation";

export default function RootPage() {
  // Always redirect to dashboard by default in server-side
  // Settings can be reached via navigation if token is missing (handled client-side there)
  redirect("/dashboard");
}
