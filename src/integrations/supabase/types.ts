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
          truck: string | null
          updated_at: string
          username: string | null
          vehicle_height_cm: number | null
          vehicle_length_cm: number | null
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
          truck?: string | null
          updated_at?: string
          username?: string | null
          vehicle_height_cm?: number | null
          vehicle_length_cm?: number | null
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
          truck?: string | null
          updated_at?: string
          username?: string | null
          vehicle_height_cm?: number | null
          vehicle_length_cm?: number | null
          vehicle_type?: string | null
          vehicle_weight_kg?: number | null
          vehicle_width_cm?: number | null
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
          created_at: string
          distance_m: number | null
          duration_s: number | null
          id: string
          name: string
          updated_at: string
          user_id: string
          waypoints: Json
        }
        Insert: {
          created_at?: string
          distance_m?: number | null
          duration_s?: number | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          waypoints?: Json
        }
        Update: {
          created_at?: string
          distance_m?: number | null
          duration_s?: number | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          waypoints?: Json
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
