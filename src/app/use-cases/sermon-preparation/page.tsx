import { redirect } from "next/navigation";
import { localizedPath } from "@/i18n/routing";

export default function SermonPreparationPage() {
  redirect(localizedPath("/use-cases/sermon-preparation", "en"));
}
