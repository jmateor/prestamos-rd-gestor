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
      audit_log: {
        Row: {
          accion: string
          created_at: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          id: string
          notas: string | null
          registro_id: string | null
          tabla: string
          user_id: string
        }
        Insert: {
          accion: string
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          notas?: string | null
          registro_id?: string | null
          tabla: string
          user_id: string
        }
        Update: {
          accion?: string
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          notas?: string | null
          registro_id?: string | null
          tabla?: string
          user_id?: string
        }
        Relationships: []
      }
      autorizaciones: {
        Row: {
          created_at: string
          estado: string | null
          fecha_autorizacion: string | null
          fecha_solicitud: string | null
          id: string
          monto: number | null
          prestamo_id: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string
          estado?: string | null
          fecha_autorizacion?: string | null
          fecha_solicitud?: string | null
          id?: string
          monto?: number | null
          prestamo_id?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string
          estado?: string | null
          fecha_autorizacion?: string | null
          fecha_solicitud?: string | null
          id?: string
          monto?: number | null
          prestamo_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autorizaciones_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      bancos: {
        Row: {
          created_at: string
          id: string
          nombre: string
          numero_cuenta: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          numero_cuenta?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          numero_cuenta?: string | null
        }
        Relationships: []
      }
      cajas: {
        Row: {
          abierta: boolean | null
          created_at: string
          id: string
          nombre: string
          usuario_id: string | null
        }
        Insert: {
          abierta?: boolean | null
          created_at?: string
          id?: string
          nombre: string
          usuario_id?: string | null
        }
        Update: {
          abierta?: boolean | null
          created_at?: string
          id?: string
          nombre?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      cierres_caja: {
        Row: {
          caja_id: string | null
          cerrado_at: string | null
          created_at: string
          diferencia: number
          estado: string
          fecha: string
          id: string
          monto_apertura: number
          monto_cierre: number
          notas: string | null
          total_cheques: number
          total_efectivo: number
          total_transferencias: number
          usuario_id: string
        }
        Insert: {
          caja_id?: string | null
          cerrado_at?: string | null
          created_at?: string
          diferencia?: number
          estado?: string
          fecha?: string
          id?: string
          monto_apertura?: number
          monto_cierre?: number
          notas?: string | null
          total_cheques?: number
          total_efectivo?: number
          total_transferencias?: number
          usuario_id: string
        }
        Update: {
          caja_id?: string | null
          cerrado_at?: string | null
          created_at?: string
          diferencia?: number
          estado?: string
          fecha?: string
          id?: string
          monto_apertura?: number
          monto_cierre?: number
          notas?: string | null
          total_cheques?: number
          total_efectivo?: number
          total_transferencias?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cierres_caja_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          alias: string | null
          antiguedad_laboral: string | null
          banco_nombre: string | null
          cargo: string | null
          cedula: string
          cedula_frontal_url: string | null
          cedula_trasera_url: string | null
          ciudad: string | null
          created_at: string
          created_by: string | null
          credit_score: number | null
          direccion: string | null
          direccion_trabajo: string | null
          email: string | null
          estado: string
          estado_civil: string | null
          fecha_nacimiento: string | null
          foto: string | null
          id: string
          ingreso_mensual: number | null
          latitud: number | null
          longitud: number | null
          lugar_trabajo: string | null
          nacionalidad: string | null
          nivel_riesgo: string | null
          notas: string | null
          numero_cuenta: string | null
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
          alias?: string | null
          antiguedad_laboral?: string | null
          banco_nombre?: string | null
          cargo?: string | null
          cedula: string
          cedula_frontal_url?: string | null
          cedula_trasera_url?: string | null
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          credit_score?: number | null
          direccion?: string | null
          direccion_trabajo?: string | null
          email?: string | null
          estado?: string
          estado_civil?: string | null
          fecha_nacimiento?: string | null
          foto?: string | null
          id?: string
          ingreso_mensual?: number | null
          latitud?: number | null
          longitud?: number | null
          lugar_trabajo?: string | null
          nacionalidad?: string | null
          nivel_riesgo?: string | null
          notas?: string | null
          numero_cuenta?: string | null
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
          alias?: string | null
          antiguedad_laboral?: string | null
          banco_nombre?: string | null
          cargo?: string | null
          cedula?: string
          cedula_frontal_url?: string | null
          cedula_trasera_url?: string | null
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          credit_score?: number | null
          direccion?: string | null
          direccion_trabajo?: string | null
          email?: string | null
          estado?: string
          estado_civil?: string | null
          fecha_nacimiento?: string | null
          foto?: string | null
          id?: string
          ingreso_mensual?: number | null
          latitud?: number | null
          longitud?: number | null
          lugar_trabajo?: string | null
          nacionalidad?: string | null
          nivel_riesgo?: string | null
          notas?: string | null
          numero_cuenta?: string | null
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
      cobradores: {
        Row: {
          activo: boolean | null
          comision_cobro: number | null
          comision_venta: number | null
          created_at: string
          id: string
          identificacion: string | null
          nombre: string
          user_id: string | null
        }
        Insert: {
          activo?: boolean | null
          comision_cobro?: number | null
          comision_venta?: number | null
          created_at?: string
          id?: string
          identificacion?: string | null
          nombre: string
          user_id?: string | null
        }
        Update: {
          activo?: boolean | null
          comision_cobro?: number | null
          comision_venta?: number | null
          created_at?: string
          id?: string
          identificacion?: string | null
          nombre?: string
          user_id?: string | null
        }
        Relationships: []
      }
      conyuges_cliente: {
        Row: {
          cargo: string | null
          cedula: string | null
          cliente_id: string
          created_at: string
          id: string
          ingreso_mensual: number | null
          lugar_trabajo: string | null
          nombre_completo: string
          notas: string | null
          telefono: string | null
        }
        Insert: {
          cargo?: string | null
          cedula?: string | null
          cliente_id: string
          created_at?: string
          id?: string
          ingreso_mensual?: number | null
          lugar_trabajo?: string | null
          nombre_completo: string
          notas?: string | null
          telefono?: string | null
        }
        Update: {
          cargo?: string | null
          cedula?: string | null
          cliente_id?: string
          created_at?: string
          id?: string
          ingreso_mensual?: number | null
          lugar_trabajo?: string | null
          nombre_completo?: string
          notas?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conyuges_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cuotas: {
        Row: {
          capital: number
          created_at: string
          estado: string
          fecha_pago: string | null
          fecha_vencimiento: string
          id: string
          interes: number
          monto_cuota: number
          monto_pagado: number
          mora: number | null
          numero_cuota: number
          prestamo_id: string
          saldo_pendiente: number
        }
        Insert: {
          capital?: number
          created_at?: string
          estado?: string
          fecha_pago?: string | null
          fecha_vencimiento: string
          id?: string
          interes?: number
          monto_cuota: number
          monto_pagado?: number
          mora?: number | null
          numero_cuota: number
          prestamo_id: string
          saldo_pendiente?: number
        }
        Update: {
          capital?: number
          created_at?: string
          estado?: string
          fecha_pago?: string | null
          fecha_vencimiento?: string
          id?: string
          interes?: number
          monto_cuota?: number
          monto_pagado?: number
          mora?: number | null
          numero_cuota?: number
          prestamo_id?: string
          saldo_pendiente?: number
        }
        Relationships: [
          {
            foreignKeyName: "cuotas_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      dependientes_cliente: {
        Row: {
          cliente_id: string
          created_at: string
          edad: number | null
          id: string
          nombre_completo: string
          notas: string | null
          parentesco: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          edad?: number | null
          id?: string
          nombre_completo: string
          notas?: string | null
          parentesco?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          edad?: number | null
          id?: string
          nombre_completo?: string
          notas?: string | null
          parentesco?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependientes_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      financiamientos: {
        Row: {
          activo: boolean | null
          created_at: string
          id: string
          interes_moratorio: number | null
          nombre: string
          plazo_max: number | null
          plazo_min: number | null
          tasa_interes: number | null
          tipo_amortizacion: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          id?: string
          interes_moratorio?: number | null
          nombre: string
          plazo_max?: number | null
          plazo_min?: number | null
          tasa_interes?: number | null
          tipo_amortizacion?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          id?: string
          interes_moratorio?: number | null
          nombre?: string
          plazo_max?: number | null
          plazo_min?: number | null
          tasa_interes?: number | null
          tipo_amortizacion?: string | null
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
      garantes_personales: {
        Row: {
          cargo: string | null
          cedula: string
          cliente_id: string | null
          created_at: string
          direccion: string | null
          email: string | null
          estado: string | null
          id: string
          ingreso_mensual: number | null
          lugar_trabajo: string | null
          nombre_completo: string
          notas: string | null
          prestamo_id: string | null
          relacion: string | null
          telefono: string
          telefono2: string | null
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          cedula: string
          cliente_id?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          ingreso_mensual?: number | null
          lugar_trabajo?: string | null
          nombre_completo: string
          notas?: string | null
          prestamo_id?: string | null
          relacion?: string | null
          telefono: string
          telefono2?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          cedula?: string
          cliente_id?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          ingreso_mensual?: number | null
          lugar_trabajo?: string | null
          nombre_completo?: string
          notas?: string | null
          prestamo_id?: string | null
          relacion?: string | null
          telefono?: string
          telefono2?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garantes_personales_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garantes_personales_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      garantia_documentos: {
        Row: {
          created_at: string
          garantia_id: string
          id: string
          nombre: string
          tipo: string | null
          url: string
        }
        Insert: {
          created_at?: string
          garantia_id: string
          id?: string
          nombre?: string
          tipo?: string | null
          url: string
        }
        Update: {
          created_at?: string
          garantia_id?: string
          id?: string
          nombre?: string
          tipo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "garantia_documentos_garantia_id_fkey"
            columns: ["garantia_id"]
            isOneToOne: false
            referencedRelation: "garantias_prendarias"
            referencedColumns: ["id"]
          },
        ]
      }
      garantias_prendarias: {
        Row: {
          anio: number | null
          cliente_id: string | null
          color: string | null
          created_at: string
          descripcion: string
          estado: string | null
          id: string
          marca: string | null
          modelo: string | null
          notas: string | null
          numero_chasis: string | null
          numero_matricula: string | null
          numero_placa: string | null
          numero_serie: string | null
          numero_titulo: string | null
          prestamo_id: string | null
          tipo: string
          ubicacion: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          anio?: number | null
          cliente_id?: string | null
          color?: string | null
          created_at?: string
          descripcion?: string
          estado?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          notas?: string | null
          numero_chasis?: string | null
          numero_matricula?: string | null
          numero_placa?: string | null
          numero_serie?: string | null
          numero_titulo?: string | null
          prestamo_id?: string | null
          tipo?: string
          ubicacion?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          anio?: number | null
          cliente_id?: string | null
          color?: string | null
          created_at?: string
          descripcion?: string
          estado?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          notas?: string | null
          numero_chasis?: string | null
          numero_matricula?: string | null
          numero_placa?: string | null
          numero_serie?: string | null
          numero_titulo?: string | null
          prestamo_id?: string | null
          tipo?: string
          ubicacion?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "garantias_prendarias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garantias_prendarias_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos_prestamo: {
        Row: {
          created_at: string
          id: string
          monto: number | null
          prestamo_id: string
          tipo: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          monto?: number | null
          prestamo_id: string
          tipo?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          monto?: number | null
          prestamo_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_prestamo_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      gestion_cobranza: {
        Row: {
          cliente_id: string
          cobrador_id: string | null
          created_at: string
          fecha_visita: string
          id: string
          notas: string | null
          prestamo_id: string
          resultado: string | null
          tipo_gestion: string | null
        }
        Insert: {
          cliente_id: string
          cobrador_id?: string | null
          created_at?: string
          fecha_visita?: string
          id?: string
          notas?: string | null
          prestamo_id: string
          resultado?: string | null
          tipo_gestion?: string | null
        }
        Update: {
          cliente_id?: string
          cobrador_id?: string | null
          created_at?: string
          fecha_visita?: string
          id?: string
          notas?: string | null
          prestamo_id?: string
          resultado?: string | null
          tipo_gestion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gestion_cobranza_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gestion_cobranza_cobrador_id_fkey"
            columns: ["cobrador_id"]
            isOneToOne: false
            referencedRelation: "cobradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gestion_cobranza_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_credito: {
        Row: {
          aplicada: boolean | null
          concepto: string | null
          created_at: string
          fecha: string | null
          id: string
          monto: number | null
          prestamo_id: string | null
        }
        Insert: {
          aplicada?: boolean | null
          concepto?: string | null
          created_at?: string
          fecha?: string | null
          id?: string
          monto?: number | null
          prestamo_id?: string | null
        }
        Update: {
          aplicada?: boolean | null
          concepto?: string | null
          created_at?: string
          fecha?: string | null
          id?: string
          monto?: number | null
          prestamo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_credito_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          banco_cheque: string | null
          caja_id: string | null
          capital_pagado: number | null
          cobrador_id: string | null
          created_at: string
          created_by: string | null
          cuota_id: string | null
          fecha_pago: string
          id: string
          interes_pagado: number | null
          metodo_pago: string
          monto_pagado: number
          mora_pagada: number | null
          notas: string | null
          numero_cheque: string | null
          numero_referencia: string | null
          prestamo_id: string
          recibido_por: string | null
          recibo_numero: string | null
          referencia: string | null
        }
        Insert: {
          banco_cheque?: string | null
          caja_id?: string | null
          capital_pagado?: number | null
          cobrador_id?: string | null
          created_at?: string
          created_by?: string | null
          cuota_id?: string | null
          fecha_pago?: string
          id?: string
          interes_pagado?: number | null
          metodo_pago?: string
          monto_pagado: number
          mora_pagada?: number | null
          notas?: string | null
          numero_cheque?: string | null
          numero_referencia?: string | null
          prestamo_id: string
          recibido_por?: string | null
          recibo_numero?: string | null
          referencia?: string | null
        }
        Update: {
          banco_cheque?: string | null
          caja_id?: string | null
          capital_pagado?: number | null
          cobrador_id?: string | null
          created_at?: string
          created_by?: string | null
          cuota_id?: string | null
          fecha_pago?: string
          id?: string
          interes_pagado?: number | null
          metodo_pago?: string
          monto_pagado?: number
          mora_pagada?: number | null
          notas?: string | null
          numero_cheque?: string | null
          numero_referencia?: string | null
          prestamo_id?: string
          recibido_por?: string | null
          recibo_numero?: string | null
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_cuota_id_fkey"
            columns: ["cuota_id"]
            isOneToOne: false
            referencedRelation: "cuotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros_sistema: {
        Row: {
          categoria: string | null
          clave: string
          created_at: string
          descripcion: string | null
          id: string
          tipo: string | null
          updated_at: string
          valor: string
        }
        Insert: {
          categoria?: string | null
          clave: string
          created_at?: string
          descripcion?: string | null
          id?: string
          tipo?: string | null
          updated_at?: string
          valor: string
        }
        Update: {
          categoria?: string | null
          clave?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          tipo?: string | null
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      prestamos: {
        Row: {
          banco_id: string | null
          cliente_id: string
          cobrador_id: string | null
          comentario: string | null
          created_at: string
          created_by: string | null
          cuota_estimada: number | null
          estado: string
          fecha_desembolso: string
          fecha_inicio: string | null
          fecha_vencimiento: string | null
          financiamiento_id: string | null
          frecuencia_pago: string
          gastos_cierre: number | null
          gastos_legales: number | null
          id: string
          metodo_amortizacion: string
          monto_aprobado: number
          monto_pagado: number | null
          nota_credito_id: string | null
          notas: string | null
          numero_prestamo: string
          oficial_credito_id: string
          plazo_meses: number
          proposito: string | null
          saldo_pendiente: number | null
          solicitud_id: string | null
          tasa_interes: number
          tipo_amortizacion: string | null
          total_cuotas: number | null
          updated_at: string
          zona_id: string | null
        }
        Insert: {
          banco_id?: string | null
          cliente_id: string
          cobrador_id?: string | null
          comentario?: string | null
          created_at?: string
          created_by?: string | null
          cuota_estimada?: number | null
          estado?: string
          fecha_desembolso?: string
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          financiamiento_id?: string | null
          frecuencia_pago?: string
          gastos_cierre?: number | null
          gastos_legales?: number | null
          id?: string
          metodo_amortizacion?: string
          monto_aprobado: number
          monto_pagado?: number | null
          nota_credito_id?: string | null
          notas?: string | null
          numero_prestamo: string
          oficial_credito_id: string
          plazo_meses: number
          proposito?: string | null
          saldo_pendiente?: number | null
          solicitud_id?: string | null
          tasa_interes: number
          tipo_amortizacion?: string | null
          total_cuotas?: number | null
          updated_at?: string
          zona_id?: string | null
        }
        Update: {
          banco_id?: string | null
          cliente_id?: string
          cobrador_id?: string | null
          comentario?: string | null
          created_at?: string
          created_by?: string | null
          cuota_estimada?: number | null
          estado?: string
          fecha_desembolso?: string
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          financiamiento_id?: string | null
          frecuencia_pago?: string
          gastos_cierre?: number | null
          gastos_legales?: number | null
          id?: string
          metodo_amortizacion?: string
          monto_aprobado?: number
          monto_pagado?: number | null
          nota_credito_id?: string | null
          notas?: string | null
          numero_prestamo?: string
          oficial_credito_id?: string
          plazo_meses?: number
          proposito?: string | null
          saldo_pendiente?: number | null
          solicitud_id?: string | null
          tasa_interes?: number
          tipo_amortizacion?: string | null
          total_cuotas?: number | null
          updated_at?: string
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prestamos_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_cobrador_id_fkey"
            columns: ["cobrador_id"]
            isOneToOne: false
            referencedRelation: "cobradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_financiamiento_id_fkey"
            columns: ["financiamiento_id"]
            isOneToOne: false
            referencedRelation: "financiamientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_nota_credito_id_fkey"
            columns: ["nota_credito_id"]
            isOneToOne: false
            referencedRelation: "notas_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas"
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
      referencias_cliente: {
        Row: {
          cliente_id: string
          created_at: string
          direccion: string | null
          empresa: string | null
          id: string
          nombre_completo: string
          notas: string | null
          relacion: string | null
          telefono: string
          tipo: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          direccion?: string | null
          empresa?: string | null
          id?: string
          nombre_completo: string
          notas?: string | null
          relacion?: string | null
          telefono?: string
          tipo?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          direccion?: string | null
          empresa?: string | null
          id?: string
          nombre_completo?: string
          notas?: string | null
          relacion?: string | null
          telefono?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "referencias_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitud_garantia_fotos: {
        Row: {
          created_at: string
          id: string
          nombre: string
          solicitud_id: string
          tipo: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre?: string
          solicitud_id: string
          tipo?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          solicitud_id?: string
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitud_garantia_fotos_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes: {
        Row: {
          aprobado_por: string | null
          cliente_id: string
          comentarios_evaluacion: string | null
          created_at: string
          created_by: string | null
          estado: string
          evaluacion_automatica: string | null
          evaluado_por: string | null
          fecha_aprobacion: string | null
          fecha_evaluacion: string | null
          fecha_solicitud: string | null
          foto_adjunto: string | null
          foto_cedula: string | null
          frecuencia_pago: string
          garantia_anio: number | null
          garantia_color: string | null
          garantia_direccion_propiedad: string | null
          garantia_documento_propiedad: string | null
          garantia_estado: string | null
          garantia_estado_bien: string | null
          garantia_marca: string | null
          garantia_modelo: string | null
          garantia_nombre_articulo: string | null
          garantia_notas: string | null
          garantia_numero_chasis: string | null
          garantia_numero_matricula: string | null
          garantia_numero_placa: string | null
          garantia_tamano: string | null
          garantia_tipo_propiedad: string | null
          garantia_valor_estimado: number | null
          gastos_cierre: number | null
          gastos_legales: number | null
          id: string
          monto_aprobado: number | null
          monto_solicitado: number
          notas: string | null
          numero_solicitud: string
          oficial_credito_id: string
          plazo_meses: number
          porcentaje_prestamo_garantia: number | null
          proposito: string
          score_al_solicitar: number | null
          tasa_interes_sugerida: number | null
          tiene_garantia: boolean
          tipo_amortizacion: string | null
          tipo_garantia: string | null
          updated_at: string
        }
        Insert: {
          aprobado_por?: string | null
          cliente_id: string
          comentarios_evaluacion?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          evaluacion_automatica?: string | null
          evaluado_por?: string | null
          fecha_aprobacion?: string | null
          fecha_evaluacion?: string | null
          fecha_solicitud?: string | null
          foto_adjunto?: string | null
          foto_cedula?: string | null
          frecuencia_pago: string
          garantia_anio?: number | null
          garantia_color?: string | null
          garantia_direccion_propiedad?: string | null
          garantia_documento_propiedad?: string | null
          garantia_estado?: string | null
          garantia_estado_bien?: string | null
          garantia_marca?: string | null
          garantia_modelo?: string | null
          garantia_nombre_articulo?: string | null
          garantia_notas?: string | null
          garantia_numero_chasis?: string | null
          garantia_numero_matricula?: string | null
          garantia_numero_placa?: string | null
          garantia_tamano?: string | null
          garantia_tipo_propiedad?: string | null
          garantia_valor_estimado?: number | null
          gastos_cierre?: number | null
          gastos_legales?: number | null
          id?: string
          monto_aprobado?: number | null
          monto_solicitado: number
          notas?: string | null
          numero_solicitud: string
          oficial_credito_id: string
          plazo_meses: number
          porcentaje_prestamo_garantia?: number | null
          proposito?: string
          score_al_solicitar?: number | null
          tasa_interes_sugerida?: number | null
          tiene_garantia?: boolean
          tipo_amortizacion?: string | null
          tipo_garantia?: string | null
          updated_at?: string
        }
        Update: {
          aprobado_por?: string | null
          cliente_id?: string
          comentarios_evaluacion?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          evaluacion_automatica?: string | null
          evaluado_por?: string | null
          fecha_aprobacion?: string | null
          fecha_evaluacion?: string | null
          fecha_solicitud?: string | null
          foto_adjunto?: string | null
          foto_cedula?: string | null
          frecuencia_pago?: string
          garantia_anio?: number | null
          garantia_color?: string | null
          garantia_direccion_propiedad?: string | null
          garantia_documento_propiedad?: string | null
          garantia_estado?: string | null
          garantia_estado_bien?: string | null
          garantia_marca?: string | null
          garantia_modelo?: string | null
          garantia_nombre_articulo?: string | null
          garantia_notas?: string | null
          garantia_numero_chasis?: string | null
          garantia_numero_matricula?: string | null
          garantia_numero_placa?: string | null
          garantia_tamano?: string | null
          garantia_tipo_propiedad?: string | null
          garantia_valor_estimado?: number | null
          gastos_cierre?: number | null
          gastos_legales?: number | null
          id?: string
          monto_aprobado?: number | null
          monto_solicitado?: number
          notas?: string | null
          numero_solicitud?: string
          oficial_credito_id?: string
          plazo_meses?: number
          porcentaje_prestamo_garantia?: number | null
          proposito?: string
          score_al_solicitar?: number | null
          tasa_interes_sugerida?: number | null
          tiene_garantia?: boolean
          tipo_amortizacion?: string | null
          tipo_garantia?: string | null
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
      sync_queue: {
        Row: {
          attempts: number | null
          created_at: string
          data: Json
          error: string | null
          id: string
          operation: string
          record_id: string
          status: string
          synced_at: string | null
          table_name: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          data?: Json
          error?: string | null
          id?: string
          operation: string
          record_id: string
          status?: string
          synced_at?: string | null
          table_name: string
        }
        Update: {
          attempts?: number | null
          created_at?: string
          data?: Json
          error?: string | null
          id?: string
          operation?: string
          record_id?: string
          status?: string
          synced_at?: string | null
          table_name?: string
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
      zonas: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
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
