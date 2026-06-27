import { redirect } from "next/navigation";
import { localizedPath } from "@/i18n/routing";

export default function TeleprompterModePage() {
  redirect(localizedPath("/features/teleprompter-mode", "en"));
}
