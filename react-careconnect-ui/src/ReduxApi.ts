import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { demoMode, accessToken } from "./RestAuth";
import { demoRequest } from "./ReduxDemoDatabase";
import type {
  Patient,
  Appointment,
  Provider,
  Verification,
  Notice,
  Audit,
  Page,
  Booking,
} from "./TypeScriptModels";
const live = fetchBaseQuery({
  baseUrl: "/api/v1",
  prepareHeaders: async (h) => {
    h.set("Authorization", "Bearer " + (await accessToken()));
    return h;
  },
});
const query: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extra) => {
  if (!demoMode) return live(args, api, extra);
  const r = typeof args === "string" ? { url: args } : args;
  try {
    return { data: await demoRequest("/api/v1" + r.url, r.method, r.body) };
  } catch (e) {
    return {
      error: {
        status: 400,
        data: { detail: e instanceof Error ? e.message : "Request failed" },
      },
    };
  }
};
export const restApi = createApi({
  reducerPath: "restApi",
  baseQuery: query,
  tagTypes: [
    "Patients",
    "Appointments",
    "Verifications",
    "Notifications",
    "Audit",
  ],
  endpoints: (b) => ({
    contacts: b.query<{ id: string; label: string; value: string }[], string>({
      query: (id) => `/patients/${id}/contacts`,
      providesTags: ["Patients"],
    }),
    myPatients: b.query<Patient[], void>({
      query: () => "/patients/me",
      providesTags: ["Patients"],
    }),
    patients: b.query<
      Page<Patient>,
      { q?: string; page?: number; size?: number }
    >({
      query: ({ q = "", page = 0, size = 20 }) =>
        `/patients?q=${encodeURIComponent(q)}&page=${page}&size=${size}`,
      providesTags: ["Patients"],
    }),
    addPatient: b.mutation<Patient, Omit<Patient, "id">>({
      query: (body) => ({ url: "/patients", method: "POST", body }),
      invalidatesTags: ["Patients", "Audit"],
    }),
    appointments: b.query<
      Page<Appointment>,
      { q?: string; status?: string; page?: number; size?: number }
    >({
      query: ({ q = "", status = "", page = 0, size = 20 }) =>
        `/appointments?q=${encodeURIComponent(q)}&status=${status}&page=${page}&size=${size}`,
      providesTags: ["Appointments"],
    }),
    book: b.mutation<Appointment, Booking>({
      query: (body) => ({
        url: "/appointments",
        method: "POST",
        body,
        headers: { "Idempotency-Key": crypto.randomUUID() },
      }),
      invalidatesTags: ["Appointments", "Audit", "Notifications"],
    }),
    status: b.mutation<Appointment, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/appointments/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Appointments", "Audit", "Notifications"],
    }),
    providers: b.query<
      { source: string; results: Provider[] },
      { name?: string; state?: string }
    >({
      query: ({ name = "", state = "NY" }) =>
        `/providers?state=${state}&name=${encodeURIComponent(name)}`,
    }),
    verifications: b.query<Verification[], void>({
      query: () => "/verifications",
      providesTags: ["Verifications"],
    }),
    verify: b.mutation<
      Verification,
      { patientId: string; memberId: string; payer: string }
    >({
      query: (body) => ({ url: "/verifications", method: "POST", body }),
      invalidatesTags: ["Verifications"],
    }),
    notifications: b.query<Notice[], void>({
      query: () => "/notifications",
      providesTags: ["Notifications"],
    }),
    audit: b.query<Audit[], void>({
      query: () => "/audit",
      providesTags: ["Audit"],
    }),
  }),
});
export const {
  useContactsQuery,
  useMyPatientsQuery,
  usePatientsQuery,
  useAddPatientMutation,
  useAppointmentsQuery,
  useBookMutation,
  useStatusMutation,
  useProvidersQuery,
  useVerificationsQuery,
  useVerifyMutation,
  useNotificationsQuery,
  useAuditQuery,
} = restApi;
export function errorText(e: unknown) {
  const x = e as { data?: { detail?: string }; error?: string };
  return x?.data?.detail || x?.error || "Request failed. Please try again.";
}
