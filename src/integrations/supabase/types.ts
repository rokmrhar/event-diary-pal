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
      activities: {
        Row: {
          aktivnost: string
          aktivnost_drugo: string | null
          created_at: string
          datum: string
          id: string
          konec: string
          kraj: string
          opis: string
          updated_at: string
          user_id: string
          zacetek: string
        }
        Insert: {
          aktivnost: string
          aktivnost_drugo?: string | null
          created_at?: string
          datum: string
          id?: string
          konec: string
          kraj: string
          opis: string
          updated_at?: string
          user_id: string
          zacetek: string
        }
        Update: {
          aktivnost?: string
          aktivnost_drugo?: string | null
          created_at?: string
          datum?: string
          id?: string
          konec?: string
          kraj?: string
          opis?: string
          updated_at?: string
          user_id?: string
          zacetek?: string
        }
        Relationships: []
      }
      activity_attendees: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          person_name: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          person_name: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          person_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_attendees_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          id: string
          reminder_days_before: number | null
          reminder_recipients: string[] | null
          smtp_from: string | null
          smtp_from_name: string | null
          smtp_host: string | null
          smtp_pass: string | null
          smtp_port: number | null
          smtp_secure: boolean | null
          smtp_user: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          reminder_days_before?: number | null
          reminder_recipients?: string[] | null
          smtp_from?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_user?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          reminder_days_before?: number | null
          reminder_recipients?: string[] | null
          smtp_from?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_user?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ida_hrbtisca: {
        Row: {
          created_at: string
          datum_pregleda: string | null
          id: string
          interna_st: string
          leto_izdelave: number | null
          lokacija: string | null
          model: string | null
          opombe: string | null
          serijska_st: string | null
          updated_at: string
          user_id: string
          znamka: string | null
        }
        Insert: {
          created_at?: string
          datum_pregleda?: string | null
          id?: string
          interna_st: string
          leto_izdelave?: number | null
          lokacija?: string | null
          model?: string | null
          opombe?: string | null
          serijska_st?: string | null
          updated_at?: string
          user_id: string
          znamka?: string | null
        }
        Update: {
          created_at?: string
          datum_pregleda?: string | null
          id?: string
          interna_st?: string
          leto_izdelave?: number | null
          lokacija?: string | null
          model?: string | null
          opombe?: string | null
          serijska_st?: string | null
          updated_at?: string
          user_id?: string
          znamka?: string | null
        }
        Relationships: []
      }
      ida_maske: {
        Row: {
          created_at: string
          datum_menjave_membrane: string | null
          datum_menjave_ventila: string | null
          datum_veljavnosti_pregleda: string | null
          datum_zadnjega_pregleda: string | null
          id: string
          interna_st: string
          leto_izdelave: number | null
          model: string | null
          opombe: string | null
          proizvajalec: string | null
          serijska_st: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          datum_menjave_membrane?: string | null
          datum_menjave_ventila?: string | null
          datum_veljavnosti_pregleda?: string | null
          datum_zadnjega_pregleda?: string | null
          id?: string
          interna_st: string
          leto_izdelave?: number | null
          model?: string | null
          opombe?: string | null
          proizvajalec?: string | null
          serijska_st?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          datum_menjave_membrane?: string | null
          datum_menjave_ventila?: string | null
          datum_veljavnosti_pregleda?: string | null
          datum_zadnjega_pregleda?: string | null
          id?: string
          interna_st?: string
          leto_izdelave?: number | null
          model?: string | null
          opombe?: string | null
          proizvajalec?: string | null
          serijska_st?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ida_pljucni_avtomati: {
        Row: {
          created_at: string
          datum_veljavnosti_pregleda: string | null
          datum_zadnjega_pregleda: string | null
          id: string
          leto_izdelave: number | null
          lokacija: string | null
          naziv: string | null
          opombe: string | null
          serijska_st: string | null
          tip: string | null
          updated_at: string
          user_id: string
          znamka: string | null
        }
        Insert: {
          created_at?: string
          datum_veljavnosti_pregleda?: string | null
          datum_zadnjega_pregleda?: string | null
          id?: string
          leto_izdelave?: number | null
          lokacija?: string | null
          naziv?: string | null
          opombe?: string | null
          serijska_st?: string | null
          tip?: string | null
          updated_at?: string
          user_id: string
          znamka?: string | null
        }
        Update: {
          created_at?: string
          datum_veljavnosti_pregleda?: string | null
          datum_zadnjega_pregleda?: string | null
          id?: string
          leto_izdelave?: number | null
          lokacija?: string | null
          naziv?: string | null
          opombe?: string | null
          serijska_st?: string | null
          tip?: string | null
          updated_at?: string
          user_id?: string
          znamka?: string | null
        }
        Relationships: []
      }
      ida_tlacne_posode: {
        Row: {
          created_at: string
          datum_veljavnosti_pregleda: string | null
          datum_zadnjega_pregleda: string | null
          id: string
          interna_st: string
          kapaciteta_l: number | null
          leto_proizvodnje: number | null
          opombe: string | null
          proizvajalec: string | null
          serijska_st: string | null
          tlak_bar: number | null
          updated_at: string
          user_id: string
          vrsta: string | null
        }
        Insert: {
          created_at?: string
          datum_veljavnosti_pregleda?: string | null
          datum_zadnjega_pregleda?: string | null
          id?: string
          interna_st: string
          kapaciteta_l?: number | null
          leto_proizvodnje?: number | null
          opombe?: string | null
          proizvajalec?: string | null
          serijska_st?: string | null
          tlak_bar?: number | null
          updated_at?: string
          user_id: string
          vrsta?: string | null
        }
        Update: {
          created_at?: string
          datum_veljavnosti_pregleda?: string | null
          datum_zadnjega_pregleda?: string | null
          id?: string
          interna_st?: string
          kapaciteta_l?: number | null
          leto_proizvodnje?: number | null
          opombe?: string | null
          proizvajalec?: string | null
          serijska_st?: string | null
          tlak_bar?: number | null
          updated_at?: string
          user_id?: string
          vrsta?: string | null
        }
        Relationships: []
      }
      ida_vozila: {
        Row: {
          created_at: string
          hrbtisce_id: string | null
          id: string
          ida_aparat: string | null
          opombe: string | null
          pljucni_avtomat_id: string | null
          updated_at: string
          user_id: string
          vozilo: string | null
        }
        Insert: {
          created_at?: string
          hrbtisce_id?: string | null
          id?: string
          ida_aparat?: string | null
          opombe?: string | null
          pljucni_avtomat_id?: string | null
          updated_at?: string
          user_id: string
          vozilo?: string | null
        }
        Update: {
          created_at?: string
          hrbtisce_id?: string | null
          id?: string
          ida_aparat?: string | null
          opombe?: string | null
          pljucni_avtomat_id?: string | null
          updated_at?: string
          user_id?: string
          vozilo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ida_vozila_hrbtisce_id_fkey"
            columns: ["hrbtisce_id"]
            isOneToOne: false
            referencedRelation: "ida_hrbtisca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ida_vozila_pljucni_avtomat_id_fkey"
            columns: ["pljucni_avtomat_id"]
            isOneToOne: false
            referencedRelation: "ida_pljucni_avtomati"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_attendees: {
        Row: {
          created_at: string
          id: string
          intervention_id: string
          person_name: string
          prisoten: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          intervention_id: string
          person_name: string
          prisoten?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          intervention_id?: string
          person_name?: string
          prisoten?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "intervention_attendees_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_vehicles: {
        Row: {
          created_at: string
          id: string
          intervention_id: string
          klicni_znak: string | null
          tip_vozila: string
          uporabljeno: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          intervention_id: string
          klicni_znak?: string | null
          tip_vozila: string
          uporabljeno?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          intervention_id?: string
          klicni_znak?: string | null
          tip_vozila?: string
          uporabljeno?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "intervention_vehicles_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          cas_polne_ure: string | null
          created_at: string
          datum: string
          id: string
          naziv: string
          obcina: string
          obcina_drugo: string | null
          opombe: string | null
          skupina: string
          stevilka: string | null
          trajanje_do: string
          trajanje_od: string
          updated_at: string
          user_id: string
          vodja: string
        }
        Insert: {
          cas_polne_ure?: string | null
          created_at?: string
          datum: string
          id?: string
          naziv: string
          obcina?: string
          obcina_drugo?: string | null
          opombe?: string | null
          skupina?: string
          stevilka?: string | null
          trajanje_do: string
          trajanje_od: string
          updated_at?: string
          user_id: string
          vodja: string
        }
        Update: {
          cas_polne_ure?: string | null
          created_at?: string
          datum?: string
          id?: string
          naziv?: string
          obcina?: string
          obcina_drugo?: string | null
          opombe?: string | null
          skupina?: string
          stevilka?: string | null
          trajanje_do?: string
          trajanje_od?: string
          updated_at?: string
          user_id?: string
          vodja?: string
        }
        Relationships: []
      }
      major_event_dogodki: {
        Row: {
          created_at: string
          datum: string
          id: string
          intervention_id: string | null
          lokacija: string | null
          major_event_id: string
          naziv: string
          opis: string | null
          prisotni: Json
          updated_at: string
          ura: string | null
          user_id: string
          vodja: string | null
          vozila: Json
          vozila_drugo: string | null
        }
        Insert: {
          created_at?: string
          datum: string
          id?: string
          intervention_id?: string | null
          lokacija?: string | null
          major_event_id: string
          naziv: string
          opis?: string | null
          prisotni?: Json
          updated_at?: string
          ura?: string | null
          user_id: string
          vodja?: string | null
          vozila?: Json
          vozila_drugo?: string | null
        }
        Update: {
          created_at?: string
          datum?: string
          id?: string
          intervention_id?: string | null
          lokacija?: string | null
          major_event_id?: string
          naziv?: string
          opis?: string | null
          prisotni?: Json
          updated_at?: string
          ura?: string | null
          user_id?: string
          vodja?: string | null
          vozila?: Json
          vozila_drugo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "major_event_dogodki_major_event_id_fkey"
            columns: ["major_event_id"]
            isOneToOne: false
            referencedRelation: "major_events"
            referencedColumns: ["id"]
          },
        ]
      }
      major_events: {
        Row: {
          closed_at: string | null
          created_at: string
          delovni_kanali: string | null
          id: string
          naziv: string
          opened_at: string
          opombe: string | null
          status: string
          updated_at: string
          user_id: string
          vodja: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          delovni_kanali?: string | null
          id?: string
          naziv: string
          opened_at?: string
          opombe?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vodja?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          delovni_kanali?: string | null
          id?: string
          naziv?: string
          opened_at?: string
          opombe?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vodja?: string | null
        }
        Relationships: []
      }
      medical_checks: {
        Row: {
          created_at: string
          id: string
          member_name: string
          naslednji_pregled: string | null
          opombe: string | null
          updated_at: string
          user_id: string
          zadnji_pregled: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          member_name: string
          naslednji_pregled?: string | null
          opombe?: string | null
          updated_at?: string
          user_id: string
          zadnji_pregled?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          member_name?: string
          naslednji_pregled?: string | null
          opombe?: string | null
          updated_at?: string
          user_id?: string
          zadnji_pregled?: string | null
        }
        Relationships: []
      }
      medical_reminder_log: {
        Row: {
          id: string
          medical_check_id: string
          naslednji_pregled: string
          recipients: string[]
          sent_at: string
        }
        Insert: {
          id?: string
          medical_check_id: string
          naslednji_pregled: string
          recipients?: string[]
          sent_at?: string
        }
        Update: {
          id?: string
          medical_check_id?: string
          naslednji_pregled?: string
          recipients?: string[]
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_reminder_log_medical_check_id_fkey"
            columns: ["medical_check_id"]
            isOneToOne: false
            referencedRelation: "medical_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pranja: {
        Row: {
          created_at: string
          dal_prat: string
          datum: string
          id: string
          opombe: string | null
          oprema: string
          programi: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dal_prat: string
          datum: string
          id?: string
          opombe?: string | null
          oprema: string
          programi?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dal_prat?: string
          datum?: string
          id?: string
          opombe?: string | null
          oprema?: string
          programi?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tlacne_posode_polnjenja: {
        Row: {
          created_at: string
          datum: string
          id: string
          opombe: string | null
          polnil: string
          posoda_id: string
          stanje_stevca_h: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          datum: string
          id?: string
          opombe?: string | null
          polnil: string
          posoda_id: string
          stanje_stevca_h?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          datum?: string
          id?: string
          opombe?: string | null
          polnil?: string
          posoda_id?: string
          stanje_stevca_h?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tlacne_posode_polnjenja_posoda_id_fkey"
            columns: ["posoda_id"]
            isOneToOne: false
            referencedRelation: "ida_tlacne_posode"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_permissions: {
        Row: {
          created_at: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
          user_id?: string
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
      vehicle_inspections: {
        Row: {
          created_at: string
          id: string
          naslednji_pregled: string | null
          opombe: string | null
          updated_at: string
          user_id: string
          vehicle_id: string
          zadnji_pregled: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          naslednji_pregled?: string | null
          opombe?: string | null
          updated_at?: string
          user_id: string
          vehicle_id: string
          zadnji_pregled?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          naslednji_pregled?: string | null
          opombe?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          zadnji_pregled?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_services: {
        Row: {
          created_at: string
          datum: string
          id: string
          opis: string
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          datum: string
          id?: string
          opis: string
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          datum?: string
          id?: string
          opis?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_services_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          id: string
          model: string | null
          opombe: string | null
          oznaka: string
          registracija: string | null
          st_sedezev: number | null
          updated_at: string
          user_id: string
          znamka: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string | null
          opombe?: string | null
          oznaka: string
          registracija?: string | null
          st_sedezev?: number | null
          updated_at?: string
          user_id: string
          znamka?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          model?: string | null
          opombe?: string | null
          oznaka?: string
          registracija?: string | null
          st_sedezev?: number | null
          updated_at?: string
          user_id?: string
          znamka?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_module_permission: {
        Args: { _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
