import { redirect } from "next/navigation";
import { localizedPath } from "@/i18n/routing";

export default function AiSpeechWriterPage() {
  redirect(localizedPath("/features/ai-speech-writer", "en"));
}
