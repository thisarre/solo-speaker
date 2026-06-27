import { redirect } from "next/navigation";
import { localizedPath } from "@/i18n/routing";

export default function ResetPasswordPage() {
  redirect(localizedPath("/reset-password", "en"));
}
