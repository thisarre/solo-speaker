export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          speaker_role: "pastor" | "conference_speaker" | "trainer" | "founder" | "speaker";
          primary_talk_type: "sermon" | "conference" | "training" | "pitch" | "speech";
          onboarding_completed_at: string | null;
          onboarding_help_requested: boolean;
          onboarding_support_note: string;
          billing_plan: "trial" | "studio" | "pro" | "team";
          team_id: string | null;
          ai_credits_used: number;
          trial_reminders_sent: string[];
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          speaker_role?: "pastor" | "conference_speaker" | "trainer" | "founder" | "speaker";
          primary_talk_type?: "sermon" | "conference" | "training" | "pitch" | "speech";
          onboarding_completed_at?: string | null;
          onboarding_help_requested?: boolean;
          onboarding_support_note?: string;
          billing_plan?: "trial" | "studio" | "pro" | "team";
          team_id?: string | null;
          ai_credits_used?: number;
          trial_reminders_sent?: string[];
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          speaker_role?: "pastor" | "conference_speaker" | "trainer" | "founder" | "speaker";
          primary_talk_type?: "sermon" | "conference" | "training" | "pitch" | "speech";
          onboarding_completed_at?: string | null;
          onboarding_help_requested?: boolean;
          onboarding_support_note?: string;
          billing_plan?: "trial" | "studio" | "pro" | "team";
          team_id?: string | null;
          ai_credits_used?: number;
          trial_reminders_sent?: string[];
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          max_seats: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name?: string;
          max_seats?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          max_seats?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      team_invitations: {
        Row: {
          id: string;
          team_id: string;
          email: string;
          token: string;
          status: "pending" | "active" | "revoked";
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          email: string;
          token?: string;
          status?: "pending" | "active" | "revoked";
          invited_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          email?: string;
          token?: string;
          status?: "pending" | "active" | "revoked";
          invited_at?: string;
          accepted_at?: string | null;
        };
        Relationships: [];
      };
      talks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: "sermon" | "conference" | "training" | "pitch" | "speech";
          status: "draft" | "ready" | "archived";
          audience: string;
          duration_minutes: number;
          language: "FR" | "EN" | "ES" | "DE" | "IT" | "PT";
          source_talk_id: string | null;
          parent_talk_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          type: "sermon" | "conference" | "training" | "pitch" | "speech";
          status?: "draft" | "ready" | "archived";
          audience?: string;
          duration_minutes?: number;
          language?: "FR" | "EN" | "ES" | "DE" | "IT" | "PT";
          source_talk_id?: string | null;
          parent_talk_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          type?: "sermon" | "conference" | "training" | "pitch" | "speech";
          status?: "draft" | "ready" | "archived";
          audience?: string;
          duration_minutes?: number;
          language?: "FR" | "EN" | "ES" | "DE" | "IT" | "PT";
          source_talk_id?: string | null;
          parent_talk_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      talk_sections: {
        Row: {
          id: string;
          talk_id: string;
          heading: string;
          body: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          talk_id: string;
          heading: string;
          body?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          talk_id?: string;
          heading?: string;
          body?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: "studio" | "pro" | "team";
          cadence: "monthly" | "yearly";
          status: string;
          seats: number;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan: "studio" | "pro" | "team";
          cadence: "monthly" | "yearly";
          status: string;
          seats?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "studio" | "pro" | "team";
          cadence?: "monthly" | "yearly";
          status?: string;
          seats?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rehearsal_sessions: {
        Row: {
          id: string;
          user_id: string;
          talk_id: string | null;
          talk_title: string | null;
          started_at: string;
          duration_seconds: number;
          estimated_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          talk_id?: string | null;
          talk_title?: string | null;
          started_at: string;
          duration_seconds: number;
          estimated_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          talk_id?: string | null;
          talk_title?: string | null;
          started_at?: string;
          duration_seconds?: number;
          estimated_seconds?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stt_sessions: {
        Row: {
          id: string;
          user_id: string;
          period_key: string;
          reserved_seconds: number;
          confirmed_seconds: number | null;
          status: "reserved" | "confirmed" | "expired";
          engine: "cloud" | "browser";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          period_key: string;
          reserved_seconds?: number;
          confirmed_seconds?: number | null;
          status?: "reserved" | "confirmed" | "expired";
          engine?: "cloud" | "browser";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_key?: string;
          reserved_seconds?: number;
          confirmed_seconds?: number | null;
          status?: "reserved" | "confirmed" | "expired";
          engine?: "cloud" | "browser";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_counters: {
        Row: {
          user_id: string;
          period_key: string;
          cloud_reserved_seconds: number;
          cloud_confirmed_seconds: number;
          browser_seconds: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          period_key: string;
          cloud_reserved_seconds?: number;
          cloud_confirmed_seconds?: number;
          browser_seconds?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          period_key?: string;
          cloud_reserved_seconds?: number;
          cloud_confirmed_seconds?: number;
          browser_seconds?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
