import { redirect } from "next/navigation";
import { localizedPath } from "@/i18n/routing";

export default function ForgotPasswordPage() {
  redirect(localizedPath("/forgot-password", "en"));
}
