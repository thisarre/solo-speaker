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
          created_at?: string;
          updated_at?: string;
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
          language: "FR" | "EN";
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
          language?: "FR" | "EN";
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
          language?: "FR" | "EN";
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
