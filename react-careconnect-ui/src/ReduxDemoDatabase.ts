import type {
  Patient,
  Appointment,
  Verification,
  Notice,
  Audit,
  Provider,
} from "./TypeScriptModels";
const providers: Provider[] = [
  {
    id: "demo-rivera",
    name: "Dr. Elena Rivera",
    specialty: "Family Medicine",
    city: "New York",
    state: "NY",
  },
  {
    id: "demo-morgan",
    name: "Dr. James Morgan",
    specialty: "Cardiology",
    city: "White Plains",
    state: "NY",
  },
  {
    id: "demo-shah",
    name: "Dr. Priya Shah",
    specialty: "Dermatology",
    city: "Scarsdale",
    state: "NY",
  },
];
export type DemoDatabase = {
  patients: Patient[];
  appointments: Appointment[];
  verifications: Verification[];
  notifications: Notice[];
  audit: Audit[];
};
const names = ["Maya Bennett", "Noah Williams", "Ava Patel", "Oliver Chen"];
const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
];
export function initialDatabase(): DemoDatabase {
  const patients = names.map((name, i) => ({
    id: ids[i],
    name,
    email: name.toLowerCase().split(" ")[0] + "@example.test",
    dateOfBirth: ["1991-04-12", "1985-09-03", "1994-02-16", "1978-11-22"][i],
    phone: "555-010" + i,
    insurance: i % 2 ? "Cedar Care" : "Northstar Health",
    memberId: "NS100" + (i + 1),
    ownerSub: i === 0 ? "patient-demo" : "patient-" + i,
  }));
  const appointments = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + (i > 3 ? 1 : 0));
    date.setHours(9 + i, 0, 0, 0);
    return {
      id: "seed-appointment-" + i,
      patientId: ids[i % 4],
      patientName: names[i % 4],
      providerId: providers[i % 3].id,
      providerName: providers[i % 3].name,
      specialty: providers[i % 3].specialty,
      startsAt: date.toISOString(),
      status: (i === 0 ? "COMPLETED" : "CONFIRMED") as Appointment["status"],
      visitType: i % 2 ? "Video visit" : "In person",
    };
  });
  return {
    patients,
    appointments,
    verifications: [],
    notifications: [
      {
        id: "welcome",
        message:
          "Welcome to CareConnect. All records in this demo are synthetic.",
        deliveryStatus: "SIMULATED",
        createdAt: new Date().toISOString(),
      },
    ],
    audit: [],
  };
}
const storageKey = "careconnect-demo-v1";
function load(): DemoDatabase {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : initialDatabase();
  } catch {
    return initialDatabase();
  }
}
function save(db: DemoDatabase) {
  localStorage.setItem(storageKey, JSON.stringify(db));
}
export function resetDemo() {
  localStorage.removeItem(storageKey);
  location.reload();
}
export async function demoRequest(url: string, method = "GET", body?: unknown) {
  await new Promise((r) => setTimeout(r, 160));
  const db = load();
  const u = new URL(url, "http://demo");
  const path = u.pathname;
  const b = body as Record<string, string>;
  const now = new Date().toISOString();
  const page = (rows: unknown[]) => {
    const p = Math.max(0, Number(u.searchParams.get("page") || 0)),
      s = Number(u.searchParams.get("size") || 20);
    return {
      content: rows.slice(p * s, p * s + s),
      totalElements: rows.length,
      totalPages: Math.ceil(rows.length / s),
      number: p,
    };
  };
  const activity = (action: string, id: string) => {
    db.audit.unshift({
      id: crypto.randomUUID(),
      actor: "staff-demo",
      action,
      aggregateId: id,
      createdAt: now,
    });
  };
  if (path.endsWith("/contacts")) {
    const p = db.patients.find((p) => p.id === path.split("/").at(-2));
    return p ? [{ id: p.id, label: "Mobile", value: p.phone }] : [];
  }
  if (path.endsWith("/patients/me")) return db.patients.slice(0, 1);
  if (path.endsWith("/providers"))
    return {
      source: "SIMULATED NPI DIRECTORY",
      results: providers.filter((p) =>
        p.name
          .toLowerCase()
          .includes((u.searchParams.get("name") || "").toLowerCase()),
      ),
    };
  if (path.endsWith("/patients") && method === "GET") {
    const q = (u.searchParams.get("q") || "").toLowerCase();
    return page(
      db.patients.filter((p) => (p.name + p.email).toLowerCase().includes(q)),
    );
  }
  if (path.endsWith("/patients") && method === "POST") {
    if (
      db.patients.some((p) => p.email === b.email || p.memberId === b.memberId)
    )
      throw Error("Email or member ID already exists");
    const p = { ...b, id: crypto.randomUUID() } as Patient;
    db.patients.push(p);
    activity("PATIENT_CREATED", p.id);
    save(db);
    return p;
  }
  if (path.endsWith("/appointments") && method === "GET") {
    const q = (u.searchParams.get("q") || "").toLowerCase(),
      status = u.searchParams.get("status");
    return page(
      db.appointments
        .filter(
          (a) =>
            a.patientName.toLowerCase().includes(q) &&
            (!status || a.status === status),
        )
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    );
  }
  if (path.endsWith("/appointments") && method === "POST") {
    if (new Date(b.startsAt) <= new Date())
      throw Error("Choose a future appointment");
    if (
      db.appointments.some(
        (a) =>
          a.status === "CONFIRMED" &&
          a.startsAt === b.startsAt &&
          (a.providerId === b.providerId || a.patientId === b.patientId),
      )
    )
      throw Error(
        "This provider or patient already has an appointment in this slot",
      );
    const p = db.patients.find((p) => p.id === b.patientId);
    if (!p) throw Error("Patient not found");
    const a = {
      ...b,
      id: crypto.randomUUID(),
      patientName: p.name,
      status: "CONFIRMED",
    } as Appointment;
    db.appointments.push(a);
    activity("BOOKED", a.id);
    db.notifications.unshift({
      id: crypto.randomUUID(),
      message: `BOOKED: ${p.name} with ${a.providerName}`,
      deliveryStatus: "SIMULATED",
      createdAt: now,
    });
    save(db);
    return a;
  }
  if (path.endsWith("/status") && method === "PATCH") {
    const id = path.split("/").at(-2);
    const a = db.appointments.find((a) => a.id === id);
    if (!a) throw Error("Appointment not found");
    if (a.status !== "CONFIRMED")
      throw Error("Only confirmed appointments can change status");
    if (b.status === "COMPLETED" && new Date(a.startsAt) > new Date())
      throw Error("A future appointment cannot be completed");
    a.status = b.status as Appointment["status"];
    activity(b.status, a.id);
    db.notifications.unshift({
      id: crypto.randomUUID(),
      message: `${b.status}: Appointment for ${a.patientName}`,
      deliveryStatus: "SIMULATED",
      createdAt: now,
    });
    save(db);
    return a;
  }
  if (path.endsWith("/verifications") && method === "GET")
    return db.verifications;
  if (path.endsWith("/verifications") && method === "POST") {
    const v = {
      ...b,
      id: crypto.randomUUID(),
      status: b.memberId.toUpperCase().startsWith("INACTIVE")
        ? "INACTIVE"
        : "ACTIVE",
      source: "SIMULATED ELIGIBILITY — NOT A COVERAGE DECISION",
      reference: "SIM-" + crypto.randomUUID().slice(0, 8),
      copay: b.memberId.toUpperCase().startsWith("INACTIVE") ? 0 : 25,
      checkedAt: now,
    } as Verification;
    db.verifications.unshift(v);
    save(db);
    return v;
  }
  if (path.endsWith("/notifications")) return db.notifications;
  if (path.endsWith("/audit")) return db.audit;
  throw Error("Demo route not found");
}
