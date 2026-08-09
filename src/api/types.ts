// ─── Users API (https://usuarios.youconnext.es) ───

export type Rol = {
  id: number;
  nombre: string;
  descripcion?: string;
};

export type Usuario = {
  id: number;
  dni?: string | null;
  name: string;
  surname?: string | null;
  email: string;
  phone?: string | null;
  img_perfil?: string | null;
  fecha_nacimiento?: string | null;
  role?: string;
  ciudad?: string | null;
  provincia?: string | null;
  onboarding_ended?: number;
  auth_method?: string;
  created_at?: string;
  updated_at?: string;
};

export type UsuarioInfo = {
  userId: number;
  name: string;
  surname?: string | null;
  phone?: string | null;
  email: string;
  img_perfil?: string | null;
  role?: string;
  averageRating?: number;
  numOpinions?: number;
  myNumOpinions?: number;
  about_me?: string | null;
  viajes?: number;
  preferences?: Record<string, string>;
};

// ─── Travels API (https://traveks.youconnext.es) ───

export type Trayecto = {
  id: string;
  origen: string;
  destino: string;
  hora: string;
  plazas: number;
  conductor: string;
  conductor_id?: string;
  img_perfil?: string | null;
  disponible: number;
  precio: number;
  origen_lat?: number;
  origen_lng?: number;
  destino_lat?: number;
  destino_lng?: number;
  routeIndex?: number | null;
  status?: string;
  valorado?: boolean;
  evento_id?: string | null;
  driverPreferences?: Record<string, boolean>;
};

export type RecorridoPunto = {
  id: string;
  id_trayecto: string;
  user_id: string;
  lat: number;
  lng: number;
  address?: string;
  created_at?: string;
};

export type Comentario = {
  id_comment: string;
  user_id_commentator: string;
  user_id_trayect: string;
  id_trayecto: string;
  opinion: string;
  rating: number;
};

export type TipoEvento = {
  id: number;
  nombre: string;
};

export type EventoTrayecto = {
  id: string;
  id_trayecto: string;
  id_reserva?: string | null;
  user_id: string;
  id_tipo_evento: number;
  tipo_evento: TipoEvento;
  lat?: number | null;
  lng?: number | null;
  created_at?: string;
};

// ─── Events & Companies API (https://usuarios.youconnext.es) ───

export type Tag = {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
};

export type Company = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  logo?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  _count?: { events: number };
};

export type EventTag = {
  tag: Tag;
};

export type CompanyRef = {
  id: string;
  name: string;
  logo?: string | null;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
};

export type PlatformEvent = {
  id: string;
  name: string;
  company_id: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  image?: string | null;
  unique_code: string;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  url?: string | null;
  ticket_url?: string | null;
  created_at?: string;
  updated_at?: string;
  company?: CompanyRef;
  tags?: EventTag[];
};

export type EventInput = {
  name: string;
  company_id: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  url?: string;
  ticket_url?: string;
  tags?: number[];
};

export type CompanyInput = {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  logo?: string;
  description?: string;
};

export type Pagination = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export type Suggestion = {
  id: string;
  name: string;
  email: string;
  website?: string | null;
  suggested_by: string;
  status: "pending" | "accepted";
  created_at?: string;
  updated_at?: string;
  user?: {
    id: string;
    name: string;
    img_perfil?: string | null;
  };
};

export type DeviceToken = {
  id: string;
  userId: string;
  email?: string;
  role?: string;
  token: string;
  platform?: string;
  deviceId?: string;
  deviceName?: string;
  active: boolean;
  lastUsedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CaeStatus = "pending" | "in_review" | "canceled" | "completed";

export type InfoCAE = {
  id: string;
  id_trayecto: string;
  conductor?: string;
  origen?: string;
  destino?: string;
  hora?: string;
  km_recorridos?: number;
  km_with_company?: number;
  kwh_generated?: number;
  eur_generated?: number;
  status: CaeStatus;
  created_at?: string;
  updated_at?: string;
};

export type CaeReportStatus = "draft" | "sent" | "reviewed";

export type CaeReport = {
  id: string;
  name: string;
  status: CaeReportStatus;
  total_kwh: number;
  total_eur: number;
  total_caes: number;
  file_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CaeReportSummary = {
  caes: {
    pendientes_envio: number;
    enviados_sin_aprobar: number;
    completados: number;
    cancelados: number;
  };
  kwh_acumulado_pendiente: number;
  kwh_umbral_envio: number;
  reportes_creados: number;
};

export type ReservaStatus = "pending" | "completed" | "canceled";

export type TripOutcome = "pending" | "completed" | "no_show" | "canceled";

export type Reserva = {
  id_reserva: string;
  user_id: string;
  id_trayecto: string;
  status: ReservaStatus;
  trip_outcome?: TripOutcome | string;
  trip_outcome_reason?: string | null;
  trip_outcome_at?: string | null;
  stripe_payment_intent_status?: string | null;
  created_at?: string;
  updated_at?: string;
  Trayecto?: Trayecto;
  User?: {
    id: string;
    name: string;
    email: string;
    img_perfil?: string | null;
  };
};
