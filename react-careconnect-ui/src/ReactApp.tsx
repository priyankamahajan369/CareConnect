import { useState } from "react";
import {
  NavLink,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Stethoscope,
  Users,
  Video,
  X,
  Mail,
  RefreshCw,
  Download,
  ExternalLink,
  Flower2,
  Sparkles,
  FileCheck2,
} from "lucide-react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  LinearProgress,
} from "@mui/material";
import {
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
  errorText,
} from "./ReduxApi";
import { demoMode, logout, staffAccess } from "./RestAuth";
import { resetDemo } from "./ReduxDemoDatabase";
import { setSearch, RootState } from "./ReduxStore";
import type { Appointment, Patient, Verification } from "./TypeScriptModels";
const nav = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/appointments", label: "Appointments", icon: CalendarDays },
  { path: "/patients", label: "Patients", icon: Users },
  { path: "/providers", label: "Provider directory", icon: Stethoscope },
  { path: "/insurance", label: "Insurance checks", icon: ShieldCheck },
  { path: "/activity", label: "Activity & messages", icon: Activity },
];
const initials = (name: string) =>
  name
    .replace(/^Dr\. /, "")
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
const date = (s: string) =>
  new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const time = (s: string) =>
  new Date(s).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
function Badge({ status }: { status: string }) {
  return (
    <span className={"badge " + status.toLowerCase()}>
      <span />
      {status.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Flower2 size={28} />
      <p>{text}</p>
    </div>
  );
}
function RequestState({
  loading,
  error,
}: {
  loading?: boolean;
  error?: unknown;
}) {
  return (
    <>
      {loading && <LinearProgress />}
      {!!error && <Alert severity="error">{errorText(error)}</Alert>}
    </>
  );
}
function Header({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function downloadCsv(rows: Appointment[]) {
  const columns = ["Patient", "Provider", "Start (UTC)", "Status", "Visit"];
  const cell = (s: string) => '"' + s.replaceAll('"', '""') + '"';
  const csv = [
    columns,
    ...rows.map((a) => [
      a.patientName,
      a.providerName,
      a.startsAt,
      a.status,
      a.visitType,
    ]),
  ]
    .map((r) => r.map(cell).join(","))
    .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "CareConnect-appointments.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
export function ReactApp() {
  const [booking, setBooking] = useState(false),
    [patient, setPatient] = useState(false),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const search = useSelector((s: RootState) => s.ui.search);
  const { data: notices } = useNotificationsQuery(undefined, {
    pollingInterval: 15000,
  });
  if (!staffAccess())
    return (
      <main className="patient-portal">
        <Heart />
        <h1>Your care, connected.</h1>
        <PatientPortal />
        <Button onClick={logout}>Sign out</Button>
      </main>
    );
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <NavLink to="/" className="brand">
          <span className="brand-icon">
            <Plus size={26} />
          </span>
          CareConnect<span className="brand-dot">•</span>
        </NavLink>
        <div className="workspace">
          <span className="workspace-avatar">CC</span>
          <div>
            Care operations<small>Clinical workspace</small>
          </div>
          <span className="workspace-tag">PRO</span>
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav>
          {nav.map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              end={n.path === "/"}
              onClick={() => {
                setMenu(false);
                dispatch(setSearch(""));
              }}
            >
              <n.icon size={19} />
              {n.label}
              {n.path === "/appointments" && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="care-card">
            <span className="care-orbit">
              <Sparkles size={22} />
            </span>
            <h3>
              Good care starts
              <br />
              with connection.
            </h3>
            <p>One workspace. Every next step.</p>
            <button onClick={() => navigate("/providers")}>
              Explore care network <ArrowUpRight size={15} />
            </button>
          </div>
          <NavLink className="settings-link" to="/settings">
            <Settings2 size={18} />
            Workspace settings
          </NavLink>
          <div className="profile">
            <div className="avatar plum">PM</div>
            <div>
              Priyanka Mahajan<small>Care coordinator · demo persona</small>
            </div>
            {!demoMode && (
              <button aria-label="Sign out" onClick={logout}>
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open menu"
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} />
            <strong>
              {nav.find((n) => n.path === location.pathname)?.label ||
                "Settings"}
            </strong>
          </div>
          <div className="top-actions">
            <label className="global-search">
              <Search size={17} />
              <input
                aria-label="Search workspace"
                placeholder="Search patients or appointments…"
                value={search}
                onChange={(e) => {
                  dispatch(setSearch(e.target.value));
                  if (
                    !["/patients", "/appointments"].includes(location.pathname)
                  )
                    navigate("/patients");
                }}
              />
              <span>⌕</span>
            </label>
            <span className="mode-label">
              <span />
              {demoMode ? "Interactive demo" : "Connected to Java APIs"}
            </span>
            <button
              className="notification-button icon-button"
              aria-label="View notifications"
              onClick={() => navigate("/activity")}
            >
              <Bell size={19} />
              {!!notices?.length && <i />}
            </button>
            <div className="avatar small plum">PM</div>
          </div>
        </header>
        <main>
          <Routes>
            <Route
              path="/"
              element={<Overview onBook={() => setBooking(true)} />}
            />
            <Route
              path="/appointments"
              element={
                <Appointments
                  onBook={() => setBooking(true)}
                  notify={setToast}
                />
              }
            />
            <Route
              path="/patients"
              element={<Patients onAdd={() => setPatient(true)} />}
            />
            <Route
              path="/providers"
              element={<Providers onBook={() => setBooking(true)} />}
            />
            <Route path="/insurance" element={<Insurance />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="*"
              element={
                <Empty text="Page not found. Choose a page from the navigation." />
              }
            />
          </Routes>
          <footer>
            <span>
              <Heart size={12} /> Designed around people.
            </span>
            <span>
              CareConnect · Synthetic data only ·{" "}
              {demoMode ? "Browser demo" : "Java API mode"}
            </span>
          </footer>
        </main>
      </div>
      <BookingDialog
        open={booking}
        onClose={() => setBooking(false)}
        onSuccess={() => {
          setBooking(false);
          setToast("Appointment booked. Notification queued.");
        }}
      />
      <PatientDialog
        open={patient}
        onClose={() => setPatient(false)}
        onSuccess={() => {
          setPatient(false);
          setToast("Patient added successfully.");
        }}
      />
      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={() => setToast("")}
        message={toast}
      />
    </div>
  );
}
function Overview({ onBook }: { onBook: () => void }) {
  const navigate = useNavigate();
  const { data: appts, isLoading, error } = useAppointmentsQuery({ size: 100 });
  const { data: patients } = usePatientsQuery({ size: 1 });
  const { data: checks } = useVerificationsQuery();
  const rows = appts?.content || [];
  const today = rows.filter(
    (a) => new Date(a.startsAt).toDateString() === new Date().toDateString(),
  );
  const confirmed = rows.filter((a) => a.status === "CONFIRMED");
  return (
    <>
      <Header
        eyebrow="A LITTLE CLARITY. A LOT OF CARE."
        title="A brighter day for better care."
        description={
          new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }) + " · Here’s your care workspace at a glance."
        }
        action={
          <button className="primary-button" onClick={onBook}>
            <Plus size={18} />
            Book appointment
          </button>
        }
      />
      <section className="hero">
        <div className="hero-text">
          <div className="hero-label">
            <span /> THE HUMAN SIDE OF HEALTHCARE
          </div>
          <h2>
            Less coordination.
            <br />
            More <em>connection.</em>
          </h2>
          <p>
            Bring your patients, appointments, and care team
            <br className="desktop" /> together. Make every next step a little
            easier.
          </p>
          <button onClick={() => navigate("/appointments")}>
            View your schedule <ArrowRight size={17} />
          </button>
          <div className="hero-proof">
            <div className="mini-avatars">
              <b>ER</b>
              <b>JM</b>
              <b>PS</b>
            </div>
            <span>One connected care team</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-disc">
            <Heart size={70} strokeWidth={1.25} />
            <span className="heart-pulse" />
          </div>
          <div className="float-card float-one">
            <span className="mint-icon">
              <Check size={19} />
            </span>
            <div>
              Care, coordinated.<small>Every detail in one place</small>
            </div>
          </div>
          <div className="float-card float-two">
            <span className="lavender-icon">
              <CalendarDays size={20} />
            </span>
            <div>
              Your next chapter<small>Starts with a simple booking</small>
            </div>
            <span className="sparkle">✦</span>
          </div>
          <span className="art-star star-one">✦</span>
          <span className="art-star star-two">✳</span>
          <div className="art-dots">
            •••
            <br />
            •••
            <br />
            •••
          </div>
        </div>
      </section>
      <section className="stats-grid">
        {[
          {
            label: "Appointments today",
            value: today.length,
            icon: CalendarDays,
            color: "peach",
            hint: "Scheduled in your local timezone",
          },
          {
            label: "Registered patients",
            value: patients?.totalElements || 0,
            icon: Users,
            color: "lavender",
            hint: "People at the center of care",
          },
          {
            label: "Upcoming bookings",
            value: confirmed.length,
            icon: Clock3,
            color: "mint",
            hint: "Confirmed in the loaded schedule",
          },
          {
            label: "Eligibility checks",
            value: checks?.length || 0,
            icon: ShieldCheck,
            color: "yellow",
            hint: "Simulated responses · latest 50",
          },
        ].map((s) => (
          <article className="stat-card" key={s.label}>
            <div>
              <span className="stat-label">{s.label}</span>
              <div className="stat-value">
                {s.value}
                <span className={"stat-icon " + s.color}>
                  <s.icon size={21} />
                </span>
              </div>
              <small>{s.hint}</small>
            </div>
          </article>
        ))}
      </section>
      <div className="overview-grid">
        <section className="panel schedule-panel">
          <div className="panel-heading">
            <div>
              <h2>
                Your care schedule{" "}
                <span className="count-pill">{today.length}</span>
              </h2>
              <p>A thoughtful plan for the day ahead.</p>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("/appointments")}
            >
              View all <ArrowRight size={15} />
            </button>
          </div>
          <RequestState loading={isLoading} error={error} />
          <AppointmentTable rows={today.slice(0, 5)} compact />
          {!today.length && !isLoading && (
            <Empty text="A little breathing room. No appointments today." />
          )}
        </section>
        <aside className="next-step">
          <div className="eyebrow">YOUR NEXT GOOD STEP</div>
          <div className="next-step-icon">
            <ShieldCheck size={31} />
          </div>
          <h2>
            Confidence before
            <br />
            the appointment.
          </h2>
          <p>
            Check a member’s simulated eligibility and keep your care team
            informed.
          </p>
          <button onClick={() => navigate("/insurance")}>
            Check eligibility <ArrowUpRight size={17} />
          </button>
          <div className="next-step-note">
            <FileCheck2 size={15} />
            Demo checks are not coverage decisions
          </div>
        </aside>
      </div>
      <section className="quick-strip">
        <div>
          <span className="mint-icon">
            <Stethoscope size={23} />
          </span>
          <div>
            <h3>The right care. A little closer.</h3>
            <p>Discover providers in the connected directory.</p>
          </div>
        </div>
        <button
          className="secondary-button"
          onClick={() => navigate("/providers")}
        >
          Find a provider <ArrowRight size={16} />
        </button>
      </section>
    </>
  );
}
function AppointmentTable({
  rows,
  compact = false,
  onStatus,
}: {
  rows: Appointment[];
  compact?: boolean;
  onStatus?: (id: string, status: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Provider & visit</th>
            <th>Date & time</th>
            <th>Status</th>
            {!compact && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((a, i) => (
            <tr key={a.id}>
              <td>
                <div className="person-cell">
                  <span
                    className={
                      "avatar " + ["peach", "lavender", "mint", "yellow"][i % 4]
                    }
                  >
                    {initials(a.patientName)}
                  </span>
                  <div>
                    <strong>{a.patientName}</strong>
                    <small>
                      {a.visitType === "Video visit" ? (
                        <Video size={12} />
                      ) : (
                        <MapPin size={12} />
                      )}{" "}
                      {a.visitType}
                    </small>
                  </div>
                </div>
              </td>
              <td>
                <strong>{a.providerName}</strong>
                <small>{a.specialty}</small>
              </td>
              <td>
                <strong>{date(a.startsAt)}</strong>
                <small>{time(a.startsAt)}</small>
              </td>
              <td>
                <Badge status={a.status} />
              </td>
              {!compact && (
                <td>
                  {a.status === "CONFIRMED" ? (
                    <div className="row-actions">
                      <button
                        aria-label={"Cancel appointment for " + a.patientName}
                        onClick={() => onStatus?.(a.id, "CANCELLED")}
                      >
                        Cancel
                      </button>
                      {new Date(a.startsAt) <= new Date() && (
                        <button onClick={() => onStatus?.(a.id, "COMPLETED")}>
                          Complete
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Appointments({
  onBook,
  notify,
}: {
  onBook: () => void;
  notify: (s: string) => void;
}) {
  const q = useSelector((s: RootState) => s.ui.search);
  const [status, setStatus] = useState(""),
    [page, setPage] = useState(0),
    [confirm, setConfirm] = useState<{ id: string; status: string } | null>(
      null,
    );
  const { data, isLoading, error } = useAppointmentsQuery({
    q,
    status,
    page,
    size: 8,
  });
  const [change, { isLoading: changing }] = useStatusMutation();
  return (
    <>
      <Header
        eyebrow="MAKE ROOM FOR GOOD CARE"
        title="Appointments"
        description="Every visit, every next step. All in one place."
        action={
          <button className="primary-button" onClick={onBook}>
            <Plus size={18} />
            Book appointment
          </button>
        }
      />
      <section className="panel">
        <div className="panel-heading">
          <div className="tabs">
            {["", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
              <button
                key={s}
                className={status === s ? "active" : ""}
                onClick={() => {
                  setStatus(s);
                  setPage(0);
                }}
              >
                {s ? s.toLowerCase() : "All appointments"}
              </button>
            ))}
          </div>
          <button
            className="text-button"
            onClick={() => downloadCsv(data?.content || [])}
          >
            <Download size={16} />
            Export page
          </button>
        </div>
        <RequestState loading={isLoading} error={error} />
        <AppointmentTable
          rows={data?.content || []}
          onStatus={(id, status) => setConfirm({ id, status })}
        />
        {!data?.content.length && !isLoading && (
          <Empty text="No appointments match this view." />
        )}
        <div className="pagination">
          <span>
            {data?.totalElements || 0} appointments · times shown locally
          </span>
          <div>
            <button
              aria-label="Previous page"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span>Page {page + 1}</span>
            <button
              aria-label="Next page"
              disabled={page + 1 >= (data?.totalPages || 1)}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      <Dialog open={!!confirm} onClose={() => setConfirm(null)}>
        <DialogTitle>
          {confirm?.status === "CANCELLED"
            ? "Cancel this appointment?"
            : "Mark this visit complete?"}
        </DialogTitle>
        <DialogContent>
          The appointment history will keep a record of this change.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Keep appointment</Button>
          <Button
            disabled={changing}
            onClick={async () => {
              if (!confirm) return;
              try {
                await change(confirm).unwrap();
                notify("Appointment updated.");
                setConfirm(null);
              } catch (e) {
                notify(errorText(e));
              }
            }}
          >
            Confirm change
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
function Patients({ onAdd }: { onAdd: () => void }) {
  const [selected, setSelected] = useState<Patient | null>(null);
  const q = useSelector((s: RootState) => s.ui.search);
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = usePatientsQuery({ q, page, size: 12 });
  return (
    <>
      <Header
        eyebrow="PEOPLE, NOT JUST RECORDS"
        title="Your patients"
        description="The people at the heart of your care community."
        action={
          <button className="primary-button" onClick={onAdd}>
            <Plus size={18} />
            Add patient
          </button>
        }
      />
      <RequestState loading={isLoading} error={error} />
      <div className="patient-grid">
        {data?.content.map((p, i) => (
          <article className="panel patient-card" key={p.id}>
            <div className="patient-top">
              <div
                className={
                  "avatar large " +
                  ["peach", "lavender", "mint", "yellow"][i % 4]
                }
              >
                {initials(p.name)}
              </div>
              <Badge status="REGISTERED" />
            </div>
            <h2>
              <button
                className="patient-name-button"
                onClick={() => setSelected(p)}
              >
                {p.name}
                <ArrowUpRight size={16} />
              </button>
            </h2>
            <p>Member · {p.memberId}</p>
            <div className="patient-detail">
              <Mail size={16} />
              {p.email}
            </div>
            <div className="patient-detail">
              <CalendarDays size={16} />
              {p.dateOfBirth}
            </div>
            <div className="patient-insurance">
              <ShieldCheck size={16} />
              {p.insurance}
            </div>
          </article>
        ))}
      </div>
      {!data?.content.length && !isLoading && (
        <Empty text="No patients match your search." />
      )}
      <PatientDetails patient={selected} onClose={() => setSelected(null)} />
      <div className="pagination">
        <span>{data?.totalElements || 0} patients</span>
        <div>
          <button disabled={!page} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <button
            disabled={page + 1 >= (data?.totalPages || 1)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
function Providers({ onBook }: { onBook: () => void }) {
  const [name, setName] = useState(""),
    [submitted, setSubmitted] = useState(""),
    [state, setState] = useState("NY");
  const { data, isLoading, error, refetch } = useProvidersQuery({
    name: submitted,
    state,
  });
  return (
    <>
      <Header
        eyebrow="A NETWORK OF POSSIBILITY"
        title="Find your care connection."
        description="Explore providers and bring the right people together."
      />
      <form
        className="provider-search panel"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(name);
        }}
      >
        <Search size={20} />
        <input
          aria-label="Provider last name"
          placeholder="Search by last name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          aria-label="Provider state"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          {["NY", "NJ", "CT", "CA", "TX", "FL"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="primary-button" type="submit">
          Find providers <ArrowRight size={16} />
        </button>
      </form>
      <div className="source-label">
        <span className="status-dot" />
        {data?.source || "Loading directory…"}
        <button className="text-button" onClick={() => refetch()}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
      <RequestState loading={isLoading} error={error} />
      <div className="provider-grid">
        {data?.results.map((p, i) => (
          <article className="panel provider-card" key={p.id}>
            <div
              className={"provider-art " + ["lavender", "peach", "mint"][i % 3]}
            >
              <span className="provider-monogram">{initials(p.name)}</span>
              <Stethoscope size={65} strokeWidth={1} />
              <span className="provider-spark">✦</span>
            </div>
            <div className="provider-content">
              <span className="eyebrow">{p.specialty}</span>
              <h2>{p.name}</h2>
              <p>
                <MapPin size={15} />
                {p.city}, {p.state}
              </p>
              <div className="provider-footer">
                <span>Directory listing</span>
                <button onClick={onBook}>
                  Book visit <ArrowUpRight size={17} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!data?.results.length && !isLoading && (
        <Empty text="No matching providers. Try another last name." />
      )}
      <p className="fine-print">
        Directory information does not confirm availability, insurance
        participation, or credentials. Demo providers are fictional.
      </p>
    </>
  );
}
function Insurance() {
  const { data: patients } = usePatientsQuery({ size: 100 });
  const { data, isLoading, error } = useVerificationsQuery();
  const [selected, setSelected] = useState(""),
    [member, setMember] = useState(""),
    [payer, setPayer] = useState(""),
    [result, setResult] = useState<Verification | null>(null);
  const [verify, { isLoading: busy, error: verifyError }] = useVerifyMutation();
  return (
    <>
      <Header
        eyebrow="CLARITY BEFORE CARE"
        title="Insurance verification"
        description="A transparent eligibility workflow for your care team."
      />
      <Alert severity="info" className="demo-alert">
        Eligibility is simulated. These responses do not establish actual
        coverage or payment. Use synthetic member details only.
      </Alert>
      <div className="insurance-grid">
        <section className="panel insurance-form">
          <h2>A clearer starting point.</h2>
          <p>Select a patient to check synthetic eligibility.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setResult(
                  await verify({
                    patientId: selected,
                    memberId: member,
                    payer,
                  }).unwrap(),
                );
              } catch {
                /* error displayed below */
              }
            }}
          >
            <TextField
              select
              required
              fullWidth
              label="Patient"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                const p = patients?.content.find(
                  (p) => p.id === e.target.value,
                );
                setMember(p?.memberId || "");
                setPayer(p?.insurance || "");
              }}
            >
              {patients?.content.map((p) => (
                <MenuItem value={p.id} key={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              required
              label="Member ID"
              value={member}
              onChange={(e) => setMember(e.target.value)}
            />
            <TextField
              fullWidth
              required
              label="Insurance payer"
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
            />
            <small>
              Tip: member IDs beginning with INACTIVE return an inactive demo
              response.
            </small>
            {!!verifyError && (
              <Alert severity="error">{errorText(verifyError)}</Alert>
            )}
            <button className="primary-button" disabled={busy} type="submit">
              <ShieldCheck size={17} />
              {busy ? "Checking…" : "Check simulated eligibility"}
            </button>
          </form>
        </section>
        <section
          className={"eligibility-result " + (result ? "has-result" : "")}
        >
          <ShieldCheck size={43} />
          <div className="eyebrow">
            {result ? "ELIGIBILITY RESPONSE" : "READY WHEN YOU ARE"}
          </div>
          <h2>
            {result
              ? result.status === "ACTIVE"
                ? "A little more clarity."
                : "Review before proceeding."
              : "Good care begins with good information."}
          </h2>
          {result ? (
            <>
              <Badge status={result.status} />
              <dl>
                <div>
                  <dt>Payer</dt>
                  <dd>{result.payer}</dd>
                </div>
                <div>
                  <dt>Simulated copay</dt>
                  <dd>${result.copay}</dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd>{result.reference}</dd>
                </div>
              </dl>
              <p>{result.source}</p>
            </>
          ) : (
            <p>Your simulated eligibility result will appear here.</p>
          )}
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Recent checks</h2>
            <p>A record of the latest 50 verification responses.</p>
          </div>
        </div>
        <RequestState loading={isLoading} error={error} />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Payer</th>
                <th>Result</th>
                <th>Checked</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((v) => (
                <tr key={v.id}>
                  <td>{v.memberId}</td>
                  <td>{v.payer}</td>
                  <td>
                    <Badge status={v.status} />
                  </td>
                  <td>
                    {date(v.checkedAt)} · {time(v.checkedAt)}
                  </td>
                  <td>{v.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data?.length && (
          <Empty text="Your verification history starts with the first check." />
        )}
      </section>
    </>
  );
}
function ActivityPage() {
  const {
    data: notices,
    isLoading,
    error,
  } = useNotificationsQuery(undefined, { pollingInterval: 5000 });
  const { data: audit } = useAuditQuery(undefined, { pollingInterval: 5000 });
  return (
    <>
      <Header
        eyebrow="EVERY STEP TELLS A STORY"
        title="Activity & messages"
        description="Follow appointment changes and notification delivery."
      />
      <div className="activity-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Care notifications</h2>
            <Bell size={19} />
          </div>
          <RequestState loading={isLoading} error={error} />
          {notices?.map((n) => (
            <div className="timeline-item" key={n.id}>
              <span className="mint-icon">
                <Mail size={18} />
              </span>
              <div>
                <p>{n.message}</p>
                <small>
                  {date(n.createdAt)} · {time(n.createdAt)}
                </small>
                <Badge status={n.deliveryStatus} />
              </div>
            </div>
          ))}
          {!notices?.length && (
            <Empty text="Appointment events will appear here." />
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Appointment audit trail</h2>
            <Activity size={19} />
          </div>
          {audit?.map((a) => (
            <div className="timeline-item" key={a.id}>
              <span className="lavender-icon">
                <CheckCircle2 size={18} />
              </span>
              <div>
                <strong>{a.action.replaceAll("_", " ")}</strong>
                <p>Record {a.aggregateId.slice(0, 8)}</p>
                <small>
                  {date(a.createdAt)} · {time(a.createdAt)}
                </small>
              </div>
            </div>
          ))}
          {!audit?.length && (
            <Empty text="Create or update an appointment to start the trail." />
          )}
        </section>
      </div>
    </>
  );
}
function Settings() {
  return (
    <>
      <Header
        eyebrow="YOUR WORKSPACE, EXPLAINED"
        title="Workspace settings"
        description="Clear configuration. No hidden switches."
      />
      <section className="panel settings-panel">
        <h2>Connection details</h2>
        <dl>
          <div>
            <dt>Application mode</dt>
            <dd>
              {demoMode
                ? "Browser demo · localStorage persistence"
                : "Live Java microservices"}
            </dd>
          </div>
          <div>
            <dt>Eligibility adapter</dt>
            <dd>Simulated · never a real coverage decision</dd>
          </div>
          <div>
            <dt>Display timezone</dt>
            <dd>{Intl.DateTimeFormat().resolvedOptions().timeZone}</dd>
          </div>
          <div>
            <dt>Patient information</dt>
            <dd>Synthetic records only</dd>
          </div>
        </dl>
        <p>
          To connect Java APIs, set VITE_MODE=live, start Docker Compose, and
          sign in with Keycloak. See README.md in the project.
        </p>
        {demoMode && (
          <Button
            color="warning"
            variant="outlined"
            onClick={() => {
              if (window.confirm("Reset all browser demo changes?"))
                resetDemo();
            }}
          >
            Reset demo data
          </Button>
        )}
      </section>
    </>
  );
}
function BookingDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: allPatients } = usePatientsQuery(
    { size: 100 },
    { skip: !open || !staffAccess() },
  );
  const { data: ownPatients } = useMyPatientsQuery(undefined, {
    skip: !open || staffAccess(),
  });
  const patients = {
    content: staffAccess() ? allPatients?.content || [] : ownPatients || [],
  };
  const { data: providers } = useProvidersQuery({}, { skip: !open });
  const [book, { isLoading, error, reset }] = useBookMutation();
  const [p, setP] = useState(""),
    [provider, setProvider] = useState(""),
    [day, setDay] = useState(""),
    [slot, setSlot] = useState("09:00"),
    [visit, setVisit] = useState("In person");
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <span className="dialog-eyebrow">A NEW CARE CONNECTION</span>Book an
        appointment
        <button
          className="dialog-close"
          aria-label="Close booking"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </DialogTitle>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const pr = providers?.results.find((x) => x.id === provider);
          if (!pr) return;
          try {
            await book({
              patientId: p,
              providerId: provider,
              providerName: pr.name,
              specialty: pr.specialty,
              startsAt: new Date(day + "T" + slot).toISOString(),
              visitType: visit,
            }).unwrap();
            setP("");
            setProvider("");
            setDay("");
            reset();
            onSuccess();
          } catch {
            /* displayed below */
          }
        }}
      >
        <DialogContent className="dialog-fields">
          <TextField
            select
            fullWidth
            required
            label="Patient"
            value={p}
            onChange={(e) => setP(e.target.value)}
          >
            {patients?.content.map((x) => (
              <MenuItem key={x.id} value={x.id}>
                {x.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            required
            label="Provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            {providers?.results.map((x) => (
              <MenuItem key={x.id} value={x.id}>
                {x.name} · {x.specialty}
              </MenuItem>
            ))}
          </TextField>
          <div className="two-fields">
            <TextField
              required
              fullWidth
              label="Visit date"
              type="date"
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: new Date().toLocaleDateString("en-CA") },
              }}
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
            <TextField
              select
              fullWidth
              label="Time (local)"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            >
              {Array.from({ length: 18 }, (_, i) => {
                const t =
                  String(9 + Math.floor(i / 2)).padStart(2, "0") +
                  ":" +
                  (i % 2 ? "30" : "00");
                return (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                );
              })}
            </TextField>
          </div>
          <TextField
            select
            label="Visit type"
            fullWidth
            value={visit}
            onChange={(e) => setVisit(e.target.value)}
          >
            <MenuItem value="In person">In person</MenuItem>
            <MenuItem value="Video visit">Video visit</MenuItem>
          </TextField>
          <Alert severity="info">
            Visits use 30-minute slots. Booking prevents duplicate provider and
            patient slots.
          </Alert>
          {!!error && <Alert severity="error">{errorText(error)}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? "Booking…" : "Confirm booking"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
function PatientDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [add, { isLoading, error }] = useAddPatientMutation();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Add a patient
        <small className="dialog-eyebrow">Use synthetic information only</small>
      </DialogTitle>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const d = Object.fromEntries(new FormData(form));
          try {
            await add({ ...d, ownerSub: d.ownerSub || "unlinked-demo" } as Omit<
              Patient,
              "id"
            >).unwrap();
            form.reset();
            onSuccess();
          } catch {
            /* displayed below */
          }
        }}
      >
        <DialogContent className="dialog-fields">
          {[
            { name: "name", label: "Full name", type: "text" },
            { name: "email", label: "Email", type: "email" },
            { name: "dateOfBirth", label: "Date of birth", type: "date" },
            { name: "phone", label: "Phone", type: "tel" },
            { name: "insurance", label: "Insurance payer", type: "text" },
            { name: "memberId", label: "Member ID", type: "text" },
            {
              name: "ownerSub",
              label: "Keycloak user ID (owner subject)",
              type: "text",
            },
          ].map((x) => (
            <TextField
              key={x.name}
              fullWidth
              required={x.name !== "phone"}
              name={x.name}
              label={x.label}
              type={x.type}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          ))}
          {!!error && <Alert severity="error">{errorText(error)}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            Save patient
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
function PatientPortal() {
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");
  const { data, error, isLoading } = useAppointmentsQuery({});
  const { data: notices } = useNotificationsQuery();
  const [change] = useStatusMutation();
  return (
    <>
      <p>Your appointments are linked to your authenticated account.</p>
      <button className="primary-button" onClick={() => setBooking(true)}>
        Book an appointment
      </button>
      <RequestState loading={isLoading} error={error} />
      <AppointmentTable
        rows={data?.content || []}
        onStatus={async (id, status) => {
          if (status !== "CANCELLED") {
            setMessage("Only staff can complete a visit.");
            return;
          }
          if (!window.confirm("Cancel this appointment?")) return;
          try {
            await change({ id, status }).unwrap();
            setMessage("Appointment cancelled.");
          } catch (e) {
            setMessage(errorText(e));
          }
        }}
      />
      {!data?.content.length && (
        <Empty text="No appointments yet. Book your first visit." />
      )}
      <h2>Your notifications</h2>
      {notices?.map((n) => (
        <p key={n.id}>{n.message}</p>
      ))}
      <BookingDialog
        open={booking}
        onClose={() => setBooking(false)}
        onSuccess={() => {
          setBooking(false);
          setMessage("Appointment booked.");
        }}
      />
      <Snackbar
        open={!!message}
        message={message}
        autoHideDuration={5000}
        onClose={() => setMessage("")}
      />
    </>
  );
}

function PatientDetails({
  patient,
  onClose,
}: {
  patient: Patient | null;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useContactsQuery(patient?.id || "", {
    skip: !patient,
  });
  return (
    <Dialog open={!!patient} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{patient?.name}</DialogTitle>
      <DialogContent>
        <p>
          Member {patient?.memberId} · {patient?.insurance}
        </p>
        <h3>Contact information</h3>
        <RequestState loading={isLoading} error={error} />
        {data?.map((c) => (
          <p key={c.id}>
            {c.label}: {c.value}
          </p>
        ))}
        {!data?.length && !isLoading && <p>No additional contacts on file.</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
