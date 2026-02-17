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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          antiguedad_laboral: string | null
          cargo: string | null
          cedula: string
          ciudad: string | null
          created_at: string
          created_by: string | null
          direccion: string | null
          direccion_trabajo: string | null
          email: string | null
          estado: string
          estado_civil: string | null
          fecha_nacimiento: string | null
          id: string
          ingreso_mensual: number | null
          lugar_trabajo: string | null
          nacionalidad: string | null
          notas: string | null
          otros_ingresos: number | null
          primer_apellido: string
          primer_nombre: string
          provincia: string | null
          referencia_direccion: string | null
          sector: string | null
          segundo_apellido: string | null
          segundo_nombre: string | null
          sexo: string | null
          telefono: string
          telefono_trabajo: string | null
          telefono2: string | null
          tiempo_residencia: string | null
          tipo_vivienda: string | null
          updated_at: string
        }
        Insert: {
          antiguedad_laboral?: string | null
          cargo?: string | null
          cedula: string
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          direccion_trabajo?: string | null
          email?: string | null
          estado?: string
          estado_civil?: string | null
          fecha_nacimiento?: string | null
          id?: string
          ingreso_mensual?: number | null
          lugar_trabajo?: string | null
          nacionalidad?: string | null
          notas?: string | null
          otros_ingresos?: number | null
          primer_apellido: string
          primer_nombre: string
          provincia?: string | null
          referencia_direccion?: string | null
          sector?: string | null
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          sexo?: string | null
          telefono: string
          telefono_trabajo?: string | null
          telefono2?: string | null
          tiempo_residencia?: string | null
          tipo_vivienda?: string | null
          updated_at?: string
        }
        Update: {
          antiguedad_laboral?: string | null
          cargo?: string | null
          cedula?: string
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          direccion_trabajo?: string | null
          email?: string | null
          estado?: string
          estado_civil?: string | null
          fecha_nacimiento?: string | null
          id?: string
          ingreso_mensual?: number | null
          lugar_trabajo?: string | null
          nacionalidad?: string | null
          notas?: string | null
          otros_ingresos?: number | null
          primer_apellido?: string
          primer_nombre?: string
          provincia?: string | null
          referencia_direccion?: string | null
          sector?: string | null
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          sexo?: string | null
          telefono?: string
          telefono_trabajo?: string | null
          telefono2?: string | null
          tiempo_residencia?: string | null
          tipo_vivienda?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      garantes: {
        Row: {
          cedula: string
          created_at: string
          direccion: string | null
          id: string
          ingreso_mensual: number | null
          lugar_trabajo: string | null
          nombre_completo: string
          relacion: string
          solicitud_id: string
          telefono: string
        }
        Insert: {
          cedula: string
          created_at?: string
          direccion?: string | null
          id?: string
          ingreso_mensual?: number | null
          lugar_trabajo?: string | null
          nombre_completo: string
          relacion?: string
          solicitud_id: string
          telefono: string
        }
        Update: {
          cedula?: string
          created_at?: string
          direccion?: string | null
          id?: string
          ingreso_mensual?: number | null
          lugar_trabajo?: string | null
          nombre_completo?: string
          relacion?: string
          solicitud_id?: string
          telefono?: string
        }
        Relationships: [
          {
            foreignKeyName: "garantes_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      solicitudes: {
        Row: {
          cliente_id: string
          comentarios_evaluacion: string | null
          created_at: string
          estado: string
          evaluado_por: string | null
          fecha_evaluacion: string | null
          frecuencia_pago: string
          id: string
          monto_solicitado: number
          numero_solicitud: string
          oficial_credito_id: string
          plazo_meses: number
          proposito: string
          tasa_interes_sugerida: number | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          comentarios_evaluacion?: string | null
          created_at?: string
          estado?: string
          evaluado_por?: string | null
          fecha_evaluacion?: string | null
          frecuencia_pago: string
          id?: string
          monto_solicitado: number
          numero_solicitud: string
          oficial_credito_id: string
          plazo_meses: number
          proposito?: string
          tasa_interes_sugerida?: number | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          comentarios_evaluacion?: string | null
          created_at?: string
          estado?: string
          evaluado_por?: string | null
          fecha_evaluacion?: string | null
          frecuencia_pago?: string
          id?: string
          monto_solicitado?: number
          numero_solicitud?: string
          oficial_credito_id?: string
          plazo_meses?: number
          proposito?: string
          tasa_interes_sugerida?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "oficial_credito" | "cajero" | "supervisor"
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
      app_role: ["admin", "oficial_credito", "cajero", "supervisor"],
    },
  },
} as const
