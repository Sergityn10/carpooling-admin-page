import { http, httpBlob, HttpError } from "./http";
import type {
  CaeReport,
  CaeReportStatus,
  CaeReportSummary,
  CaeStatus,
  Company,
  CompanyInput,
  Comentario,
  DeviceToken,
  EventInput,
  EventoTrayecto,
  InfoCAE,
  Pagination,
  PlatformEvent,
  RecorridoPunto,
  Reserva,
  ReservaStatus,
  Suggestion,
  Tag,
  Trayecto,
  Usuario,
  UsuarioInfo,
} from "./types";

export const api = {
  // ─── Auth (Users API) ───
  auth: {
    login: (email: string, password: string) =>
      http<{
        status: string;
        message: string;
        userId: string;
        token: string;
        img_perfil?: string | null;
        onboarding_ended?: number;
      }>("users", "/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    validate: (token: string) =>
      http<{
        status: string;
        message: string;
        token: string;
        data: {
          userId: string;
          email: string;
          img_perfil?: string | null;
          role?: string;
          onboarding_ended?: number;
        };
      }>("users", "/api/auth/validate", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    logout: () =>
      http<{ status: string; message: string }>("users", "/api/auth/logout"),
  },

  // ─── Users API ───
  usuarios: {
    list: () => http<Usuario[]>("users", "/api/users"),
    byId: (id: string | number) =>
      http<Usuario>("users", `/api/users/${encodeURIComponent(id)}`),
    info: (id: string | number) =>
      http<{ status: string; message: string; data: UsuarioInfo }>(
        "users",
        `/api/users/${encodeURIComponent(id)}/info`,
      ),
    delete: (id: string | number) =>
      http<{ status: string; message: string }>(
        "users",
        `/api/users/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
  },

  // ─── Travels API ───
  viajes: {
    list: () =>
      http<{ status: string; trayectos: Trayecto[] }>(
        "travels",
        "/api/trayecto",
      ),
    byId: async (id: string) => {
      // GET /api/trayecto/:id no devuelve coordenadas, pero GET /api/trayecto sí.
      // Hacemos fetch de la lista y buscamos por ID para tener origen_lat/origen_lng/etc.
      const res = await http<{ status: string; trayectos: Trayecto[] }>(
        "travels",
        "/api/trayecto",
      );
      const found = res.trayectos.find((t) => t.id === id);
      if (!found) throw new HttpError("Trayecto no encontrado", 404, null);
      return found;
    },
    byConductor: (conductorId: string) =>
      http<Trayecto[]>(
        "travels",
        `/api/trayecto/conductor/${encodeURIComponent(conductorId)}`,
      ),
    byEventoId: (eventoId: string) =>
      http<{ status: string; evento_id: string; trayectos: Trayecto[] }>(
        "travels",
        `/api/trayecto/evento/${encodeURIComponent(eventoId)}`,
      ),
    recorridoById: async (id: string) => {
      try {
        return await http<{ status: string; recorridos: RecorridoPunto[] }>(
          "travels",
          `/api/trayecto/${encodeURIComponent(id)}/recorrido`,
        );
      } catch (err) {
        if (
          err instanceof HttpError &&
          (err.status === 404 || err.status === 403)
        ) {
          return { status: "Success", recorridos: [] };
        }
        throw err;
      }
    },
    eventosById: async (id: string) => {
      try {
        return await http<{ status: string; eventos: EventoTrayecto[] }>(
          "travels",
          `/api/trayecto/${encodeURIComponent(id)}/recoger`,
        );
      } catch (err) {
        if (
          err instanceof HttpError &&
          (err.status === 404 || err.status === 403)
        ) {
          return { status: "Success", eventos: [] };
        }
        throw err;
      }
    },
    adminList: (params?: {
      status?: string;
      conductor?: string;
      evento_id?: string;
      fechaDesde?: string;
      fechaHasta?: string;
      search?: string;
      orderBy?: string;
      order?: string;
      page?: number;
      limit?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.conductor) qs.set("conductor", params.conductor);
      if (params?.evento_id) qs.set("evento_id", params.evento_id);
      if (params?.fechaDesde) qs.set("fechaDesde", params.fechaDesde);
      if (params?.fechaHasta) qs.set("fechaHasta", params.fechaHasta);
      if (params?.search) qs.set("search", params.search);
      if (params?.orderBy) qs.set("orderBy", params.orderBy);
      if (params?.order) qs.set("order", params.order);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return http<{
        status: string;
        data: Trayecto[];
        pagination: Pagination;
      }>("travels", `/api/admin/trayectos${query ? `?${query}` : ""}`);
    },
    adminById: (id: string) =>
      http<{
        status: string;
        data: Trayecto & {
          Reservas?: unknown[];
          Tramos?: unknown[];
          eventos?: EventoTrayecto[];
        };
      }>("travels", `/api/admin/trayectos/${encodeURIComponent(id)}`),
    adminUpdate: (id: string, data: Partial<Trayecto>) =>
      http<{ status: string; message: string; data: Trayecto }>(
        "travels",
        `/api/admin/trayectos/${encodeURIComponent(id)}`,
        { method: "PUT", body: JSON.stringify(data) },
      ),
    adminDelete: (id: string) =>
      http<{ status: string; message: string }>(
        "travels",
        `/api/admin/trayectos/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
  },

  // ─── Reservas (Travels API - Admin) ───
  reservas: {
    adminList: (params?: {
      status?: ReservaStatus;
      user_id?: string;
      id_trayecto?: string;
      trip_outcome?: string;
      orderBy?: string;
      order?: string;
      page?: number;
      limit?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.user_id) qs.set("user_id", params.user_id);
      if (params?.id_trayecto) qs.set("id_trayecto", params.id_trayecto);
      if (params?.trip_outcome) qs.set("trip_outcome", params.trip_outcome);
      if (params?.orderBy) qs.set("orderBy", params.orderBy);
      if (params?.order) qs.set("order", params.order);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return http<{
        status: string;
        data: Reserva[];
        pagination: Pagination;
      }>("travels", `/api/admin/reservas${query ? `?${query}` : ""}`);
    },
    adminById: (id: string) =>
      http<{ status: string; data: Reserva }>(
        "travels",
        `/api/admin/reservas/${encodeURIComponent(id)}`,
      ),
    adminUpdate: (
      id: string,
      data: Partial<{
        status: ReservaStatus;
        trip_outcome: string;
        trip_outcome_reason: string;
        trip_outcome_at: string;
        stripe_payment_intent_status: string;
      }>,
    ) =>
      http<{ status: string; data: Reserva }>(
        "travels",
        `/api/admin/reservas/${encodeURIComponent(id)}`,
        { method: "PUT", body: JSON.stringify(data) },
      ),
    adminDelete: (id: string) =>
      http<{ status: string; message: string }>(
        "travels",
        `/api/admin/reservas/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
  },

  // ─── Comments (Travels API) ───
  comentarios: {
    byTravelId: async (travelId: string) => {
      try {
        return await http<{ status: string; opinionsList: Comentario[] }>(
          "travels",
          `/api/comments/travelId/${encodeURIComponent(travelId)}`,
        );
      } catch (err) {
        if (err instanceof HttpError && err.status === 404) {
          return { status: "Success", opinionsList: [] };
        }
        throw err;
      }
    },
    byUserIdCommentator: (
      userId: string,
      params?: { page?: number; limit?: number },
    ) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return http<{
        status: string;
        opinionList: Comentario[];
        pagination?: Pagination;
      }>(
        "travels",
        `/api/comments/user_id_commentator/${encodeURIComponent(userId)}${query ? `?${query}` : ""}`,
      );
    },
    byUserIdTrayect: (
      userId: string,
      params?: { page?: number; limit?: number },
    ) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return http<{
        status: string;
        opinionList: Comentario[];
        pagination?: Pagination;
      }>(
        "travels",
        `/api/comments/user_id_trayect/${encodeURIComponent(userId)}${query ? `?${query}` : ""}`,
      );
    },
  },

  // ─── Events (Users API) ───
  eventos: {
    list: (params?: {
      search?: string;
      tag?: string;
      page?: number;
      limit?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.tag) qs.set("tag", params.tag);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return http<{
        status: string;
        events: PlatformEvent[];
        pagination: Pagination;
      }>("users", `/api/events${query ? `?${query}` : ""}`);
    },
    byId: (id: string) =>
      http<{ status: string; event: PlatformEvent }>(
        "users",
        `/api/events/${encodeURIComponent(id)}`,
      ),
    create: (data: EventInput) =>
      http<{ status: string; message: string; event: PlatformEvent }>(
        "users",
        "/api/events",
        { method: "POST", body: JSON.stringify(data) },
      ),
    update: (id: string, data: Partial<EventInput>) =>
      http<{ status: string; message: string; event: PlatformEvent }>(
        "users",
        `/api/events/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify(data) },
      ),
    remove: (id: string) =>
      http<{ status: string; message: string }>(
        "users",
        `/api/events/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
  },

  // ─── Tags (Users API) ───
  tags: {
    list: () => http<{ status: string; tags: Tag[] }>("users", "/api/tags"),
    create: (data: { name: string; description?: string }) =>
      http<{ status: string; message: string; tag: Tag }>(
        "users",
        "/api/tags",
        { method: "POST", body: JSON.stringify(data) },
      ),
    remove: (id: number) =>
      http<{ status: string; message: string }>(
        "users",
        `/api/tags/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
  },

  // ─── Companies (Users API) ───
  empresas: {
    list: (params?: { search?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return http<{
        status: string;
        companies: Company[];
        pagination: Pagination;
      }>("users", `/api/companies${query ? `?${query}` : ""}`);
    },
    byId: (id: string) =>
      http<{ status: string; company: Company & { events?: PlatformEvent[] } }>(
        "users",
        `/api/companies/${encodeURIComponent(id)}`,
      ),
    create: (data: CompanyInput) =>
      http<{ status: string; message: string; company: Company }>(
        "users",
        "/api/companies",
        { method: "POST", body: JSON.stringify(data) },
      ),
    update: (id: string, data: Partial<CompanyInput>) =>
      http<{ status: string; message: string; company: Company }>(
        "users",
        `/api/companies/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify(data) },
      ),
    remove: (id: string) =>
      http<{ status: string; message: string }>(
        "users",
        `/api/companies/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
  },

  // ─── Suggestions (Users API) ───
  sugerencias: {
    list: (params?: { status?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return http<{
        status: string;
        suggestions: Suggestion[];
        pagination: Pagination;
      }>("users", `/api/suggestions${query ? `?${query}` : ""}`);
    },
    byId: (id: string) =>
      http<{ status: string; suggestion: Suggestion }>(
        "users",
        `/api/suggestions/${encodeURIComponent(id)}`,
      ),
    accept: (id: string) =>
      http<{ status: string; message: string; company: Company }>(
        "users",
        `/api/suggestions/${encodeURIComponent(id)}/accept`,
        { method: "POST" },
      ),
    remove: (id: string) =>
      http<{ status: string; message: string }>(
        "users",
        `/api/suggestions/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
  },

  // ─── Devices (Notifications API) ───
  dispositivos: {
    listAll: () =>
      http<{ success: boolean; devices: DeviceToken[] }>(
        "notifications",
        "/api/device-tokens/admin/all",
      ),
    byUserId: async (userId: string) => {
      const res = await http<{ success: boolean; devices: DeviceToken[] }>(
        "notifications",
        "/api/device-tokens/admin/all",
      );
      return res.devices.filter((d) => d.userId === userId);
    },
    remove: (deviceId: string) =>
      http<{ success: boolean }>("notifications", "/api/device-tokens", {
        method: "DELETE",
        body: JSON.stringify({ deviceId }),
      }),
  },

  // ─── CAEs (Travels API) ───
  caes: {
    list: (params?: { status?: CaeStatus; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return http<{
        status: string;
        items: InfoCAE[];
        total: number;
        page: number;
        limit: number;
      }>("travels", `/api/cae${query ? `?${query}` : ""}`);
    },
    byUser: (userId: string) =>
      http<{ status: string; items: InfoCAE[]; total: number }>(
        "travels",
        `/api/cae/user/${encodeURIComponent(userId)}`,
      ),
    approve: (id: string) =>
      http<{ status: string; message: string }>(
        "travels",
        `/api/cae/${encodeURIComponent(id)}/approve`,
        { method: "PATCH" },
      ),
    exportExcel: (reportId: string) =>
      httpBlob(
        "users",
        `/api/cae-reports/${encodeURIComponent(reportId)}/export`,
      ),
    reportSummary: () =>
      http<{ status: string } & CaeReportSummary>(
        "travels",
        "/api/cae/reports/summary",
      ),
    reportList: (params?: {
      status?: CaeReportStatus;
      page?: number;
      limit?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return http<{
        status: string;
        items: CaeReport[];
        total: number;
        page: number;
        limit: number;
      }>("travels", `/api/cae/reports${query ? `?${query}` : ""}`);
    },
    reportCreate: (name?: string) =>
      http<{ status: string; report: CaeReport }>(
        "travels",
        "/api/cae/reports",
        { method: "POST", body: JSON.stringify(name ? { name } : {}) },
      ),
    reportById: (id: string) =>
      http<{ status: string; reporte: CaeReport; items: unknown[] }>(
        "travels",
        `/api/cae/reports/${encodeURIComponent(id)}`,
      ),
    reportUpdateStatus: (id: string, status: CaeReportStatus) =>
      http<{ status: string; report: CaeReport }>(
        "travels",
        `/api/cae/reports/${encodeURIComponent(id)}/status`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      ),
    reportDelete: (id: string) =>
      http<{ status: string; id: string; deleted: boolean }>(
        "travels",
        `/api/cae/reports/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
  },
};
