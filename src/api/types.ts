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

export type UserCreateInput = {
  email: string;
  password: string;
  name?: string;
  surname?: string;
  phone?: string;
  role?: string;
  dni?: string;
  ciudad?: string;
  provincia?: string;
  consents?: {
    privacy_policy_accepted: boolean;
    terms_of_service_accepted: boolean;
    marketing_accepted?: boolean;
    privacy_version?: string;
    terms_version?: string;
  };
};

export type UserUpdateInput = {
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  dni?: string;
  password?: string;
  fecha_nacimiento?: string;
  genero?: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  direccion?: string;
  pais?: string;
  role?: string;
  about_me?: string;
};

export type Monedero = {
  disponible: boolean;
  stripe_account: boolean;
  stripe_account_id?: string | null;
  stripe_customer_account?: string | null;
  onboarding_completado: boolean;
  charges_enabled: boolean;
  transfers_enabled: boolean;
  details_submitted: boolean;
  wallet_activa: boolean;
  wallet_balance: number;
  config?: WalletConfig;
  mensaje?: string;
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
  wallet_config?: WalletConfig;
  monedero?: Monedero;
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

export type Enterprise = {
  id: string;
  name: string;
  email: string;
  description?: string | null;
  location?: string | null;
  phone?: string | null;
  cif?: string | null;
  website?: string | null;
  logo?: string | null;
  contact_person?: string | null;
  sector?: string | null;
  employee_count?: number | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string;
  verified: boolean;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at?: string | null;
  role_id: number;
  created_at: string;
  updated_at: string;
  serviceEventsCount?: number;
  platformEventsCount?: number;
  serviceEvents?: any[];
  platformEvents?: PlatformEvent[];
  role?: { id: number; name: string };
  _count?: {
    serviceEvents?: number;
    platformEvents?: number;
    events?: number;
  };
};

export type EnterpriseCreateInput = {
  name: string;
  email: string;
  password: string;
  description: string;
  location: string;
  phone?: string;
  cif?: string;
  website?: string;
  logo?: string;
  contact_person?: string;
  sector?: string;
  employee_count?: number;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  verified?: boolean;
  is_active?: boolean;
};

export type EnterpriseUpdateInput = Partial<{
  name: string;
  email: string;
  description: string;
  location: string;
  phone: string;
  cif: string;
  website: string;
  logo: string;
  contact_person: string;
  sector: string;
  employee_count: number;
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  verified: boolean;
  is_active: boolean;
}>;

export type EnterpriseMetrics = {
  totalEnterprises: number;
  activeEnterprises: number;
  deletedEnterprises: number;
  verifiedEnterprises: number;
  totalEventsByEnterprises: number;
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
  company_id?: string | null;
  enterprise_id?: string | null;
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
  enterprise?: CompanyRef;
  tags?: EventTag[];
};

export type EventInput = {
  name: string;
  company_id?: string;
  enterprise_id?: string;
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

export type StripeAccountStatus = {
  status: string;
  account: {
    id: string;
    charges_enabled: boolean;
    transfers_enabled: boolean;
    details_submitted: boolean;
    payouts_enabled: boolean;
    capabilities?: Record<string, unknown>;
    requirements?: Record<string, unknown>;
  };
  onboarding_ended: boolean;
};

export type StripeAccountLink = {
  status: string;
  message: string;
  accountLink: {
    url: string;
    expires_at: number;
  };
  stripe_account_id?: string;
};

export type StripeLoginLink = {
  status: string;
  message: string;
  loginLink: {
    url: string;
    created: number;
  };
};

export type WalletConfig = {
  id?: string;
  user_id: string;
  wallet_enabled: boolean;
  recharges_enabled: boolean;
  payouts_enabled: boolean;
  payments_enabled: boolean;
  min_recharge_cents: number;
  max_recharge_cents: number;
  max_daily_payout_cents: number;
  stripe_account_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_account_status?: string | null;
  stripe_account_type?: string | null;
  wallet_balance_cents?: number;
  pending_balance_cents?: number;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type WalletConfigInput = Partial<{
  wallet_enabled: boolean;
  recharges_enabled: boolean;
  payouts_enabled: boolean;
  payments_enabled: boolean;
  min_recharge_cents: number;
  max_recharge_cents: number;
  max_daily_payout_cents: number;
}>;

// ─── Admin Accounts (Stripe Connect) ───

export type AccountUser = {
  id: string;
  email: string;
  name?: string;
  surname?: string;
};

export type Account = {
  stripe_account_id: string;
  user_id: string;
  charges_enabled: boolean;
  transfers_enabled: boolean;
  details_submitted: boolean;
  default_account: boolean;
  user?: AccountUser;
};

export type AccountInput = {
  stripe_account_id: string;
  user_id: string;
  charges_enabled?: boolean;
  transfers_enabled?: boolean;
  details_submitted?: boolean;
  default_account?: boolean;
};

export type AccountUpdateInput = Partial<{
  charges_enabled: boolean;
  transfers_enabled: boolean;
  details_submitted: boolean;
  default_account: boolean;
}>;

export type AccountSyncResponse = {
  status: string;
  message: string;
  account: Account;
  stripe_data: {
    charges_enabled: boolean;
    transfers_enabled: boolean;
    details_submitted: boolean;
    capabilities?: Record<string, string>;
  };
};

// ─── Admin Notifications (Notifications API) ───

export type NotificationChannel = "email" | "push";
export type NotificationTargetType = "all" | "single" | "users" | "filter";
export type NotificationPlatform = "all" | "ios" | "android" | "web";
export type NotificationPriority = "high" | "normal";
export type NotificationDispatchStatus =
  | "queued"
  | "completed"
  | "partial"
  | "failed"
  | "dry_run";

export type AdminNotificationTarget = {
  type: NotificationTargetType;
  userId?: string;
  email?: string;
  name?: string;
  token?: string;
  userIds?: string[];
  emails?: string[];
  tokens?: string[];
  role?: string;
  platform?: NotificationPlatform | string;
  fallbackToDeviceTokens?: boolean;
};

export type AdminNotificationStatusResponse = {
  success?: boolean;
  overallStatus: "healthy" | "degraded" | "unhealthy" | string;
  service: {
    name: string;
    version: string;
    environment: string;
    uptimeSeconds: number;
    runWorkers: boolean;
    timestamp: string;
    memory?: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
    };
  };
  checks: {
    database: { ok: boolean; latencyMs?: number; error?: string };
    smtp: {
      ok: boolean;
      configured: boolean;
      latencyMs?: number;
      host?: string | null;
      port?: number;
      fromEmail?: string | null;
      error?: string;
    };
    firebase: {
      ok: boolean;
      configured: boolean;
      initialized?: boolean;
      projectId?: string | null;
      error?: string;
    };
    rabbitmq: {
      configured: boolean;
      mode: string;
      deliveryQueueConnected: boolean;
      domainConsumer?: {
        connected?: boolean;
        [key: string]: unknown;
      };
    };
    userService: {
      configured: boolean;
      url?: string | null;
      batchPath?: string;
      listPath?: string;
      allowDeviceEmailFallback?: boolean;
      health?: {
        ok: boolean;
        statusCode?: number;
        error?: string;
      };
    };
  };
  queues?: {
    circuitBreakers?: Record<
      string,
      {
        isOpen?: boolean;
        failures?: number;
        lastFailureAt?: string | null;
        [key: string]: unknown;
      }
    >;
    [key: string]: unknown;
  };
  deviceTokens?: {
    total?: number;
    active?: number;
    inactive?: number;
    uniqueActiveUsers?: number;
    byPlatform?: Record<string, number>;
    byRole?: Record<string, number>;
    error?: string;
  };
  adminActivity?: {
    recentDispatchesCount: number;
    lastDispatchAt: string | null;
  };
  issues: string[];
};

export type AdminRecipientItem = {
  id: string;
  userId: string;
  email: string | null;
  role: string | null;
  platform: string | null;
  deviceId: string | null;
  deviceName: string | null;
  active: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

export type AdminRecipientsResponse = {
  success: boolean;
  items: AdminRecipientItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminPreviewResponse = {
  success: boolean;
  target: AdminNotificationTarget;
  preview: {
    push?: {
      available: boolean;
      totalDevices: number;
      uniqueUsers?: number;
      byPlatform?: Record<string, number>;
      recipientSource?: string;
      error?: string;
    };
    email?: {
      available: boolean;
      totalRecipients: number;
      recipientSource?: string;
      sampleRecipients?: Array<{ userId: string; email: string }>;
      error?: string;
    };
  };
};

export type EmailTemplateMeta = {
  name: string;
  subject: string;
};

export type NotificationCatalogItem = {
  type: string;
  description: string;
  channels: NotificationChannel[];
  requiredFields: string[];
  sharedRequiredFields: string[];
  emailTemplate: string | null;
  pushTemplate: string | null;
};

export type AdminEmailContentInput = {
  template?: string;
  data?: Record<string, string | number | boolean>;
  subject?: string;
  title?: string;
  message?: string;
  ctaText?: string;
  ctaUrl?: string;
};

export type AdminPushContentInput = {
  template?: string;
  title?: string;
  body?: string;
  data?: Record<string, string>;
  priority?: NotificationPriority;
  channelId?: string;
  badge?: number;
};

export type AdminEmailPayload = AdminEmailContentInput & {
  target: AdminNotificationTarget | "all" | "todos";
  sync?: boolean;
  dryRun?: boolean;
  priority?: NotificationPriority;
};

export type AdminPushPayload = AdminPushContentInput & {
  target: AdminNotificationTarget | "all" | "todos";
  sync?: boolean;
  dryRun?: boolean;
};

export type AdminMultiChannelPayload = {
  target: AdminNotificationTarget | "all" | "todos";
  channels: NotificationChannel[];
  email?: AdminEmailContentInput;
  push?: AdminPushContentInput;
  sync?: boolean;
  dryRun?: boolean;
};

export type AdminSyncDeliveryItemResult = {
  to?: string;
  userId?: string;
  tokenPreview?: string;
  success: boolean;
  messageId?: string;
  errorCode?: string;
  error?: string;
};

export type AdminChannelResult = {
  success: boolean;
  mode?: "sync" | "async" | "dry_run" | string;
  dryRun?: boolean;
  status?: NotificationDispatchStatus | string;
  message?: string;
  batchId?: string;
  channel?: NotificationChannel;
  recipientSource?: string;
  recipientsCount?: number;
  totalDevices?: number;
  uniqueUsers?: number;
  byPlatform?: Record<string, number>;
  jobsQueued?: number;
  queueType?: string;
  total?: number;
  succeeded?: number;
  failed?: number;
  sampleRecipients?: Array<{ userId?: string; email: string; name?: string }>;
  sampleTokens?: string[];
  results?: AdminSyncDeliveryItemResult[];
  code?: string;
  error?: string;
};

export type AdminDispatchResult = AdminChannelResult & {
  channels?: Partial<Record<NotificationChannel, AdminChannelResult>>;
};

export type AdminHistoryItem = {
  batchId: string;
  kind: "email" | "push" | "multi" | string;
  mode: "sync" | "async" | "dry_run" | string;
  status: NotificationDispatchStatus | string;
  subjectOrTitle: string;
  target: AdminNotificationTarget;
  recipientSource: string | null;
  recipientsCount: number;
  totalDevices: number | null;
  jobsQueued: number;
  succeeded: number | null;
  failed: number | null;
  channels: Partial<Record<NotificationChannel, AdminChannelResult>> | null;
  requestedBy: {
    userId?: string;
    email?: string | null;
    role?: string;
  } | null;
  error: string | null;
  createdAt: string;
};

export type AdminJobStatusResponse = {
  success: boolean;
  job: AdminHistoryItem;
};
