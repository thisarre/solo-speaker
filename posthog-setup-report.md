<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Solo Speaker. The setup covers client-side initialization via `instrumentation-client.ts`, a shared server-side client at `src/lib/posthog-server.ts`, and a reverse proxy for EU hosting. Users are identified on login and signup via a `PostHogIdentify` client component mounted in the AppShell. Thirteen events are captured across the full user lifecycle: auth, onboarding, talk management, AI assistant usage, speaking mode, voice memos, and PDF export.

| Event name | Description | File |
|---|---|---|
| `user_signed_up` | Fires when a new user successfully completes registration via email/password. | `src/modules/auth/actions.ts` |
| `user_logged_in` | Fires when an existing user successfully authenticates. | `src/modules/auth/actions.ts` |
| `onboarding_completed` | Fires when a new user submits the onboarding form with their role and talk type. | `src/modules/auth/actions.ts` |
| `talk_created` | Fires when a user successfully creates a new talk. | `src/modules/talks/actions.ts` |
| `talk_deleted` | Fires when a user deletes a talk and all its sections. | `src/modules/talks/actions.ts` |
| `talk_exported_pdf` | Fires when a talk is successfully exported as a PDF file. | `src/app/api/talks/[talkId]/export/pdf/route.ts` |
| `ai_assistant_used` | Fires when a user triggers an AI generation from the assistant panel. | `src/modules/assistant/components/assistant-panel.tsx` |
| `ai_suggestion_inserted` | Fires when a user accepts and inserts an AI-generated suggestion or prediction. | `src/components/talks/TalkEditor.tsx` |
| `speaking_session_started` | Fires when a user navigates into the speaking mode teleprompter. | `src/components/talks/TalkEditor.tsx` |
| `voice_follow_toggled` | Fires when a user enables or disables voice-follow during a speaking session. | `src/modules/speaking-mode/components/SpeakingControls.tsx` |
| `voice_memo_transcribed` | Fires when a voice memo recording is successfully transcribed by AI. | `src/modules/voice-memo/actions.ts` |
| `pricing_page_viewed` | Fires when a user views the pricing page, indicating upgrade intent. | `src/modules/pricing/components/pricing-page.tsx` |
| `ai_generation_completed` | Server-side event that fires when an AI generation request succeeds. | `src/app/api/ai/generate/route.ts` |

## Files created or modified

| File | Change |
|---|---|
| `instrumentation-client.ts` | Created — initializes posthog-js with EU host and error tracking |
| `src/lib/posthog-server.ts` | Created — shared posthog-node singleton for server-side capture |
| `src/components/analytics/PostHogIdentify.tsx` | Created — client component that calls `posthog.identify()` for logged-in users |
| `src/modules/pricing/components/pricing-tracker.tsx` | Created — client component that fires `pricing_page_viewed` on mount |
| `next.config.ts` | Added EU reverse proxy rewrites and `skipTrailingSlashRedirect` |
| `src/components/layout/AppShell.tsx` | Mounts `<PostHogIdentify>` for all authenticated routes |
| `src/modules/auth/actions.ts` | Added `user_signed_up`, `user_logged_in`, `onboarding_completed` server-side captures |
| `src/modules/talks/actions.ts` | Added `talk_created`, `talk_deleted` server-side captures |
| `src/app/api/talks/[talkId]/export/pdf/route.ts` | Added `talk_exported_pdf` server-side capture |
| `src/app/api/ai/generate/route.ts` | Added `ai_generation_completed` server-side capture |
| `src/modules/assistant/components/assistant-panel.tsx` | Added `ai_assistant_used` capture + `captureException` on error |
| `src/components/talks/TalkEditor.tsx` | Added `ai_suggestion_inserted` and `speaking_session_started` captures |
| `src/modules/speaking-mode/components/SpeakingControls.tsx` | Added `voice_follow_toggled` capture |
| `src/modules/voice-memo/actions.ts` | Added `voice_memo_transcribed` capture |
| `src/modules/pricing/components/pricing-page.tsx` | Renders `<PricingTracker>` to fire `pricing_page_viewed` |

## Next steps

We've built a dashboard and five insights to monitor user behavior:

- **Dashboard:** [Analytics basics (wizard)](https://eu.posthog.com/project/208332/dashboard/769161)
- **New signups over time:** [https://eu.posthog.com/project/208332/insights/jwdiDMnB](https://eu.posthog.com/project/208332/insights/jwdiDMnB)
- **Signup → Onboarding → First Talk funnel:** [https://eu.posthog.com/project/208332/insights/Beig8gDL](https://eu.posthog.com/project/208332/insights/Beig8gDL)
- **AI assistant usage by action:** [https://eu.posthog.com/project/208332/insights/zFZKB3no](https://eu.posthog.com/project/208332/insights/zFZKB3no)
- **Speaking sessions started vs talks created:** [https://eu.posthog.com/project/208332/insights/dGrRuS4v](https://eu.posthog.com/project/208332/insights/dGrRuS4v)
- **Pricing page views vs signups:** [https://eu.posthog.com/project/208332/insights/LuHW7etT](https://eu.posthog.com/project/208332/insights/LuHW7etT)

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any bootstrap/CI scripts so collaborators know what to set.
- [ ] Wire source-map upload into CI so production stack traces de-minify (PostHog CLI: `posthog-cli sourcemap inject && posthog-cli sourcemap upload`).
- [ ] Confirm the returning-visitor path also calls `identify` — the `PostHogIdentify` component in `AppShell` runs on every authenticated page render, so returning sessions should be covered; verify in the PostHog People view after a test login.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
