"use client";

import { useCallback, useRef, useState } from "react";
import type { TranscriptionProviderController } from "./transcription-provider";
import { languageToRealtimeCode } from "./transcription-provider";
import { lastTranscriptWords } from "../transcript-buffer";

type RealtimeTokenResponse = {
  client_secret?: {
    value?: string;
  };
  value?: string;
};

type RealtimeEvent = {
  delta?: string;
  error?: {
    message?: string;
  };
  item_id?: string;
  transcript?: string;
  type?: string;
};

export function parseRealtimeTranscriptionEvent(event: RealtimeEvent) {
  if (event.type === "conversation.item.input_audio_transcription.delta") {
    return { isFinal: false, text: event.delta?.trim() ?? "" };
  }

  if (event.type === "conversation.item.input_audio_transcription.completed") {
    return { isFinal: true, text: event.transcript?.trim() ?? "" };
  }

  const fallbackText = event.delta ?? event.transcript ?? "";
  return { isFinal: event.type?.includes("completed") || event.type?.includes("final") || false, text: fallbackText.trim() };
}

export function useOpenAIRealtimeProvider(language: "FR" | "EN"): TranscriptionProviderController {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const commitIntervalRef = useRef(0);
  const noDeltaTimeoutRef = useRef(0);
  const itemDeltasRef = useRef<Record<string, string>>({});
  const [error, setError] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [lastDeltaAt, setLastDeltaAt] = useState<number | null>(null);

  const stop = useCallback(() => {
    window.clearInterval(commitIntervalRef.current);
    window.clearTimeout(noDeltaTimeoutRef.current);
    dataChannelRef.current?.close();
    peerConnectionRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    dataChannelRef.current = null;
    peerConnectionRef.current = null;
    mediaStreamRef.current = null;
    itemDeltasRef.current = {};
    setIsRequesting(false);
    setInterimTranscript("");
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices || !window.RTCPeerConnection) {
      setError("Realtime transcription indisponible dans ce navigateur.");
      return;
    }

    stop();
    setError("");
    setIsRequesting(true);
    setFinalTranscript("");
    setInterimTranscript("");
    setLastDeltaAt(null);

    try {
      const tokenResponse = await fetch(`/api/realtime/token?language=${languageToRealtimeCode(language)}`, { method: "POST" });
      if (!tokenResponse.ok) {
        throw new Error("Token Realtime indisponible.");
      }

      const tokenPayload = (await tokenResponse.json()) as RealtimeTokenResponse;
      const ephemeralKey = tokenPayload.client_secret?.value ?? tokenPayload.value;
      if (!ephemeralKey) throw new Error("Token Realtime invalide.");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const peerConnection = new RTCPeerConnection();
      const dataChannel = peerConnection.createDataChannel("oai-events");

      stream.getAudioTracks().forEach((track) => peerConnection.addTrack(track, stream));
      dataChannel.addEventListener("open", () => {
        dataChannel.send(
          JSON.stringify({
            type: "session.update",
            session: {
              type: "transcription",
              audio: {
                input: {
                  transcription: {
                    delay: "minimal",
                    language: languageToRealtimeCode(language),
                    model: "gpt-realtime-whisper"
                  },
                  turn_detection: null
                }
              }
            }
          })
        );

        commitIntervalRef.current = window.setInterval(() => {
          if (dataChannel.readyState !== "open") return;
          dataChannel.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        }, 900);

        noDeltaTimeoutRef.current = window.setTimeout(() => {
          setError("Realtime connecté, mais aucun delta reçu. Bascule sur Browser si besoin.");
        }, 5500);
      });
      dataChannel.addEventListener("message", (message) => {
        try {
          const event = JSON.parse(String(message.data)) as RealtimeEvent;
          if (event.error?.message) setError(event.error.message);

          const parsed = parseRealtimeTranscriptionEvent(event);
          if (!parsed.text) return;

          setLastDeltaAt(Date.now());
          window.clearTimeout(noDeltaTimeoutRef.current);

          if (parsed.isFinal) {
            const finalText = parsed.text || (event.item_id ? itemDeltasRef.current[event.item_id] : "");
            if (event.item_id) delete itemDeltasRef.current[event.item_id];
            setFinalTranscript((current) => lastTranscriptWords(`${current} ${finalText}`, 48));
            setInterimTranscript("");
            return;
          }

          if (event.item_id) {
            itemDeltasRef.current[event.item_id] = `${itemDeltasRef.current[event.item_id] ?? ""} ${parsed.text}`.trim();
          }

          setInterimTranscript((current) => lastTranscriptWords(`${current} ${parsed.text}`, 14));
        } catch {
          // Ignore non-JSON control messages.
        }
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        },
        method: "POST"
      });

      if (!sdpResponse.ok) {
        const details = await sdpResponse.text().catch(() => "");
        throw new Error(`Connexion Realtime impossible (${sdpResponse.status})${details ? `: ${details.slice(0, 180)}` : ""}`);
      }

      await peerConnection.setRemoteDescription({ sdp: await sdpResponse.text(), type: "answer" });
      peerConnectionRef.current = peerConnection;
      mediaStreamRef.current = stream;
      dataChannelRef.current = dataChannel;
      setIsRequesting(false);
    } catch (realtimeError) {
      stop();
      setError(realtimeError instanceof Error ? realtimeError.message : "Realtime transcription impossible.");
    }
  }, [language, stop]);

  return {
    alternatives: [],
    error,
    finalTranscript,
    interimTranscript,
    isRequesting,
    isSupported: true,
    lastDeltaAt,
    provider: "realtime",
    start,
    stop
  };
}
