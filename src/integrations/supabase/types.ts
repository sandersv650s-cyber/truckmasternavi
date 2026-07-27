export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      alert_votes: {
        Row: {
          alert_id: string
          created_at: string
          user_id: string
          vote: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          user_id: string
          vote: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          user_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_votes_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          category: string
          confirms_count: number
          created_at: string
          expires_at: string
          id: string
          location: string
          not_actual_count: number
          text: string
          user_id: string
        }
        Insert: {
          category: string
          confirms_count?: number
          created_at?: string
          expires_at: string
          id?: string
          location: string
          not_actual_count?: number
          text: string
          user_id: string
        }
        Update: {
          category?: string
          confirms_count?: number
          created_at?: string
          expires_at?: string
          id?: string
          location?: string
          not_actual_count?: number
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          convoy_id: string | null
          created_at: string
          created_by: string
          id: string
          kind: string
          title: string | null
          updated_at: string
        }
        Insert: {
          convoy_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          kind?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          convoy_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_convoy_id_fkey"
            columns: ["convoy_id"]
            isOneToOne: false
            referencedRelation: "convoys"
            referencedColumns: ["id"]
          },
        ]
      }
      convoy_locations: {
        Row: {
          convoy_id: string
          created_at: string
          expires_at: string
          heading: number | null
          id: string
          lat: number
          lng: number
          speed_kmh: number | null
          user_id: string
        }
        Insert: {
          convoy_id: string
          created_at?: string
          expires_at: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          speed_kmh?: number | null
          user_id: string
        }
        Update: {
          convoy_id?: string
          created_at?: string
          expires_at?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          speed_kmh?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "convoy_locations_convoy_id_fkey"
            columns: ["convoy_id"]
            isOneToOne: false
            referencedRelation: "convoys"
            referencedColumns: ["id"]
          },
        ]
      }
      convoy_members: {
        Row: {
          convoy_id: string
          id: string
          joined_at: string
          role: string
          sharing_location: boolean
          sharing_until: string | null
          user_id: string
        }
        Insert: {
          convoy_id: string
          id?: string
          joined_at?: string
          role?: string
          sharing_location?: boolean
          sharing_until?: string | null
          user_id: string
        }
        Update: {
          convoy_id?: string
          id?: string
          joined_at?: string
          role?: string
          sharing_location?: boolean
          sharing_until?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "convoy_members_convoy_id_fkey"
            columns: ["convoy_id"]
            isOneToOne: false
            referencedRelation: "convoys"
            referencedColumns: ["id"]
          },
        ]
      }
      convoys: {
        Row: {
          created_at: string
          ended_at: string | null
          from_location: string | null
          id: string
          invite_code: string
          leader_id: string
          name: string
          planned_route: Json | null
          starts_at: string | null
          status: string
          to_location: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          from_location?: string | null
          id?: string
          invite_code?: string
          leader_id: string
          name: string
          planned_route?: Json | null
          starts_at?: string | null
          status?: string
          to_location?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          from_location?: string | null
          id?: string
          invite_code?: string
          leader_id?: string
          name?: string
          planned_route?: Json | null
          starts_at?: string | null
          status?: string
          to_location?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fuel_prices: {
        Row: {
          created_at: string
          fuel_type: string
          id: string
          is_demo: boolean
          price_eur: number
          reported_at: string
          source: string
          station_id: string
        }
        Insert: {
          created_at?: string
          fuel_type?: string
          id?: string
          is_demo?: boolean
          price_eur: number
          reported_at?: string
          source?: string
          station_id: string
        }
        Update: {
          created_at?: string
          fuel_type?: string
          id?: string
          is_demo?: boolean
          price_eur?: number
          reported_at?: string
          source?: string
          station_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_prices_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "fuel_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_stations: {
        Row: {
          address: string | null
          brand: string | null
          city: string | null
          country: string | null
          created_at: string
          has_adblue: boolean
          id: string
          lat: number | null
          lng: number | null
          name: string
          open_hours: string | null
          road: string | null
          truck_suitable: boolean
          updated_at: string
        }
        Insert: {
          address?: string | null
          brand?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          has_adblue?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          open_hours?: string | null
          road?: string | null
          truck_suitable?: boolean
          updated_at?: string
        }
        Update: {
          address?: string | null
          brand?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          has_adblue?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          open_hours?: string | null
          road?: string | null
          truck_suitable?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          text: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          created_at: string
          id: string
          post_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          suspended_at: string | null
          suspended_reason: string | null
          truck: string | null
          updated_at: string
          username: string | null
          vehicle_axle_count: number | null
          vehicle_axle_weight_kg: number | null
          vehicle_hazardous: boolean
          vehicle_height_cm: number | null
          vehicle_length_cm: number | null
          vehicle_trailer_count: number | null
          vehicle_type: string | null
          vehicle_weight_kg: number | null
          vehicle_width_cm: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          suspended_at?: string | null
          suspended_reason?: string | null
          truck?: string | null
          updated_at?: string
          username?: string | null
          vehicle_axle_count?: number | null
          vehicle_axle_weight_kg?: number | null
          vehicle_hazardous?: boolean
          vehicle_height_cm?: number | null
          vehicle_length_cm?: number | null
          vehicle_trailer_count?: number | null
          vehicle_type?: string | null
          vehicle_weight_kg?: number | null
          vehicle_width_cm?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          suspended_at?: string | null
          suspended_reason?: string | null
          truck?: string | null
          updated_at?: string
          username?: string | null
          vehicle_axle_count?: number | null
          vehicle_axle_weight_kg?: number | null
          vehicle_hazardous?: boolean
          vehicle_height_cm?: number | null
          vehicle_length_cm?: number | null
          vehicle_trailer_count?: number | null
          vehicle_type?: string | null
          vehicle_weight_kg?: number | null
          vehicle_width_cm?: number | null
        }
        Relationships: []
      }
      report_notes: {
        Row: {
          author_id: string
          created_at: string
          id: string
          note: string
          report_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          note: string
          report_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          note?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_notes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          admin_notes: string | null
          category: string
          context_id: string | null
          context_type: string | null
          created_at: string
          details: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          reported_user_id: string | null
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          admin_notes?: string | null
          category: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          details?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          reported_user_id?: string | null
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          admin_notes?: string | null
          category?: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          details?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rides: {
        Row: {
          avg_speed: number | null
          created_at: string
          duration_min: number
          ended_at: string | null
          from_location: string
          id: string
          km: number
          l100: number | null
          liters: number | null
          max_speed: number | null
          notes: string | null
          started_at: string
          status: string
          to_location: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_speed?: number | null
          created_at?: string
          duration_min?: number
          ended_at?: string | null
          from_location: string
          id?: string
          km?: number
          l100?: number | null
          liters?: number | null
          max_speed?: number | null
          notes?: string | null
          started_at?: string
          status?: string
          to_location: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_speed?: number | null
          created_at?: string
          duration_min?: number
          ended_at?: string | null
          from_location?: string
          id?: string
          km?: number
          l100?: number | null
          liters?: number | null
          max_speed?: number | null
          notes?: string | null
          started_at?: string
          status?: string
          to_location?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_routes: {
        Row: {
          avoid_features: string[] | null
          completed: boolean
          completed_at: string | null
          created_at: string
          distance_m: number | null
          duration_s: number | null
          id: string
          name: string
          truck_profile: Json | null
          updated_at: string
          user_id: string
          waypoints: Json
        }
        Insert: {
          avoid_features?: string[] | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          distance_m?: number | null
          duration_s?: number | null
          id?: string
          name: string
          truck_profile?: Json | null
          updated_at?: string
          user_id: string
          waypoints?: Json
        }
        Update: {
          avoid_features?: string[] | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          distance_m?: number | null
          duration_s?: number | null
          id?: string
          name?: string
          truck_profile?: Json | null
          updated_at?: string
          user_id?: string
          waypoints?: Json
        }
        Relationships: []
      }
      terminal_exceptions: {
        Row: {
          closed: boolean
          closes: string | null
          created_at: string
          date: string
          id: string
          opens: string | null
          reason: string | null
          terminal_id: string
        }
        Insert: {
          closed?: boolean
          closes?: string | null
          created_at?: string
          date: string
          id?: string
          opens?: string | null
          reason?: string | null
          terminal_id: string
        }
        Update: {
          closed?: boolean
          closes?: string | null
          created_at?: string
          date?: string
          id?: string
          opens?: string | null
          reason?: string | null
          terminal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terminal_exceptions_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      terminal_hours: {
        Row: {
          closed: boolean
          closes: string | null
          id: string
          opens: string | null
          terminal_id: string
          weekday: number
        }
        Insert: {
          closed?: boolean
          closes?: string | null
          id?: string
          opens?: string | null
          terminal_id: string
          weekday: number
        }
        Update: {
          closed?: boolean
          closes?: string | null
          id?: string
          opens?: string | null
          terminal_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "terminal_hours_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      terminal_suggestions: {
        Row: {
          created_at: string
          field: string
          id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggestion: string
          terminal_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggestion: string
          terminal_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field?: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggestion?: string
          terminal_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terminal_suggestions_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      terminals: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          email: string | null
          facilities: string[]
          id: string
          lat: number | null
          lng: number | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          type: string
          updated_at: string
          wait_time_notes: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          facilities?: string[]
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          type?: string
          updated_at?: string
          wait_time_notes?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          facilities?: string[]
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          type?: string
          updated_at?: string
          wait_time_notes?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      conversation_has_block: {
        Args: { _conv: string; _uid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _uid: string }; Returns: boolean }
      is_blocked_pair: { Args: { _a: string; _b: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conv: string; _uid: string }
        Returns: boolean
      }
      is_convoy_member: {
        Args: { _convoy: string; _uid: string }
        Returns: boolean
      }
      is_moderator: { Args: { _uid: string }; Returns: boolean }
      is_staff: { Args: { _uid: string }; Returns: boolean }
      purge_expired_convoy_locations: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
