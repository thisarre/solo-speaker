import { redirect } from "next/navigation";
import { localizedPath } from "@/i18n/routing";

export default function PublicSpeakingPage() {
  redirect(localizedPath("/use-cases/public-speaking", "en"));
}
