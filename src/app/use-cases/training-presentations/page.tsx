import { redirect } from "next/navigation";
import { localizedPath } from "@/i18n/routing";

export default function TrainingPresentationsPage() {
  redirect(localizedPath("/use-cases/training-presentations", "en"));
}
