type AiMessage = {
  content: string;
  role: "assistant" | "system" | "user";
};

type BuildAiGenerationCaptureInput = {
  action: string;
  distinctId: string;
  input: AiMessage[];
  latencySeconds?: number;
  model: string;
  outputText?: string;
  provider: "openai";
  status: number;
  talkLanguage?: string;
  talkType?: string;
  tokens?: {
    input?: number;
    output?: number;
  };
};

export function buildAiGenerationCapture(input: BuildAiGenerationCaptureInput) {
  return {
    distinctId: input.distinctId,
    event: "$ai_generation",
    properties: {
      $ai_base_url: "https://api.openai.com/v1",
      $ai_http_status: input.status,
      $ai_input: input.input,
      $ai_input_tokens: input.tokens?.input,
      $ai_is_error: input.status >= 400,
      $ai_latency: input.latencySeconds,
      $ai_model: input.model,
      $ai_output_choices: input.outputText
        ? [
            {
              role: "assistant",
              content: input.outputText
            }
          ]
        : undefined,
      $ai_output_tokens: input.tokens?.output,
      $ai_provider: input.provider,
      $ai_request_url: "https://api.openai.com/v1/responses",
      $ai_span_id: crypto.randomUUID(),
      $ai_span_name: input.action,
      $ai_trace_id: crypto.randomUUID(),
      action: input.action,
      talk_language: input.talkLanguage,
      talk_type: input.talkType
    }
  };
}
