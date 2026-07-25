import { redirect } from "next/navigation"

// Public sign-ups are disabled — anyone hitting /signup is sent to the login page.
// (The real enforcement is the "Allow new users to sign up" toggle in Supabase Auth.)
export default function SignupPage() {
  redirect("/login")
}
