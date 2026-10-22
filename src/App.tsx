import { App as CapacitorApp } from "@capacitor/app";
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  api,
  post,
  patch,
  useData,
  useToast,
  Icon,
  Brand,
  Avatar,
  Badge,
  Form,
  Modal,
  Loading,
  ErrorState,
  Empty,
  cacheKey,
} from "./ui";
import type { Row } from "./ui";
import {
  CoursePhoto,
  money,
  date,
  ResourceViewer,
  AssetUpload,
} from "./coaching-ui";
import {
  Quiz,
  Assignments,
  Downloads,
  Notifications,
  Community,
  LiveSessions,
  Certificates,
  Support,
  Assistant,
} from "./Legacy";
import { progress, note, saveDownload, sync as syncQueue } from "./offline";
import { isNative, backendUrl, setBackend, clearNativeSession } from "./native";
const tabs = [
  ["/", "Home", "House"],
  ["/courses", "Courses", "BookOpen"],
  ["/tests", "Practice", "ClipboardList"],
  ["/updates", "Updates", "Bell"],
  ["/profile", "You", "CircleUserRound"],
];
function SectionTitle({
  title,
  text,
  to,
  label = "View all",
}: {
  title: string;
  text?: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="mobile-section-title">
      <div>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {to && (
        <Link to={to}>
          {label}
          <Icon name="ChevronRight" size={15} />
        </Link>
      )}
    </div>
  );
}
function Back({ to, label }: { to: string; label: string }) {
  return (
    <Link className="back-link" to={to}>
      <Icon name="ArrowLeft" size={17} />
      {label}
    </Link>
  );
}
function Connect({ done }: { done: () => void }) {
  return (
    <div className="connect-screen">
      <Brand />
      <span className="auth-icon">
        <Icon name="Building2" size={32} />
      </span>
      <h1>Connect to your coaching</h1>
      <p>Enter the server address provided by your coaching owner.</p>
      <Form
        fields={[
          {
            name: "address",
            label: "Coaching server address",
            required: true,
            placeholder: "http://192.168.1.4:7310",
            help: "For local testing, connect your phone and computer to the same Wi-Fi. Use the computer’s LAN IP and port 7310.",
          },
        ]}
        initial={{ address: backendUrl() }}
        label="Connect & continue"
        onSubmit={async (v) => {
          await setBackend(v.address);
          await api("/health");
          done();
        }}
      />
      <small>Android emulator: http://10.0.2.2:7310</small>
    </div>
  );
}
function Auth({ done }: { done: (d: Row) => void }) {
  const [signup, setSignup] = useState(false),
    [connected, setConnected] = useState(!isNative || !!backendUrl()),
    toast = useToast();
  if (!connected) return <Connect done={() => setConnected(true)} />;
  return (
    <div className="learner-auth">
      <div className="auth-photo">
        <img src="/images/physics.png" alt="Indian physics educator" />
        <div>
          <Brand />
          <span className="eyebrow">YOUR AMBITION. A CLEAR PATH.</span>
          <h1>
            A little progress.
            <br />
            Every single day.
          </h1>
          <p>Learn with your coaching. Grow at your pace.</p>
        </div>
      </div>
      <section>
        <div className="mobile-auth-brand">
          <Brand />
          <span>COACHING, CONNECTED</span>
        </div>
        <h2>
          {signup ? "Your next chapter starts here" : "Good to see you again"}
        </h2>
        <p>
          {signup
            ? "Join your coaching centre and choose your learning package."
            : "Sign in. Pick up where your ambition left off."}
        </p>
        <Form
          key={String(signup)}
          fields={[
            ...(signup
              ? [
                  { name: "name", label: "Full name", required: true },
                  {
                    name: "phone",
                    label: "Mobile number",
                    required: true,
                    placeholder: "10-digit Indian mobile number",
                  },
                ]
              : []),
            {
              name: "email",
              label: "Email address",
              type: "email",
              required: true,
            },
            {
              name: "password",
              label: "Password",
              type: "password",
              required: true,
              help: signup ? "Use at least 12 characters." : undefined,
            },
            ...(signup
              ? [
                  {
                    name: "consent",
                    label:
                      "I agree to the coaching terms and use of my details for learning.",
                    type: "checkbox",
                  },
                ]
              : []),
          ]}
          initial={
            signup
              ? {}
              : { email: "learner@qubit.demo", password: "QubitDemo2026!" }
          }
          label={signup ? "Create my account" : "Let’s get learning"}
          onSubmit={async (v) => {
            if (signup) {
              if (!v.consent)
                throw new Error("Please agree to the terms to continue.");
              await post("/auth/register", v);
              toast("Account created. Choose a package after signing in.");
            }
            done(
              await post("/auth/login", {
                email: v.email,
                password: v.password,
              }),
            );
          }}
        />
        <button className="auth-switch" onClick={() => setSignup(!signup)}>
          {signup
            ? "Already learning with us? Sign in"
            : "New here? Create an account"}
          <Icon name="ArrowRight" size={15} />
        </button>
        {!signup && (
          <div className="demo-note">
            <Icon name="Info" size={16} />
            Pre-filled demo account includes an approved package.
          </div>
        )}
        {isNative && (
          <button
            className="text-link server-switch"
            onClick={() => setConnected(false)}
          >
            <Icon name="Settings2" size={15} />
            Change coaching server
          </button>
        )}
      </section>
    </div>
  );
}
export default function App() {
  const [session, setSession] = useState<Row | null>(null),
    [ready, setReady] = useState(false);
  const loc = useLocation(),
    navigate = useNavigate();
  const coaching = useData(session ? "/coaching/config" : "");
  useEffect(() => {
    if (!session) return;
    const refresh = () =>
      api("/me")
        .then(setSession)
        .catch((e) => {
          if (e.status === 401) {
            clearNativeSession();
            setSession(null);
          }
        });
    const t = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", refresh);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (isNative && !backendUrl()) {
      setReady(true);
      return;
    }
    api("/me")
      .then(setSession)
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  useEffect(() => {
    if (!session) return;
    const sync = () => syncQueue().catch(() => {});
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [session]);
  useEffect(() => {
    if (!isNative) return;
    const handle = CapacitorApp.addListener("backButton", () => {
      if (location.pathname !== "/") navigate(-1);
      else CapacitorApp.minimizeApp();
    });
    return () => {
      handle.then((h) => h.remove());
    };
  }, []);
  const logout = async () => {
    try {
      await post("/auth/logout");
    } catch {}
    await clearNativeSession();
    const id = localStorage.getItem("qubit-user");
    Object.keys(localStorage)
      .filter((k) => k.startsWith("qubit:" + id + ":"))
      .forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem("qubit-user");
    localStorage.removeItem("qubit-profile");
    setSession(null);
    navigate("/");
  };
  if (!ready) return <Loading />;
  if (!session) return <Auth done={setSession} />;
  const immersive =
    loc.pathname.startsWith("/lesson/") || loc.pathname.startsWith("/quiz/");
  return (
    <div className={"learner-shell " + (immersive ? "immersive" : "")}>
      <a className="skip-link" href="#learner-main">
        Skip to content
      </a>
      {!immersive && (
        <header className="learner-top">
          <Link to="/" aria-label="Qubit home">
            <Brand />
          </Link>
          <span className="learner-coaching-name">
            {coaching.data?.name || "Qubit Coaching"}
          </span>
          <Link to="/updates" aria-label="Updates" className="icon-btn">
            <Icon name="Bell" size={21} />
          </Link>
          <Link to="/profile" aria-label="My profile">
            <Avatar name={session.user.name} />
          </Link>
        </header>
      )}
      <main id="learner-main" className="learner-main">
        <Routes>
          <Route path="/" element={<Home user={session.user} />} />
          <Route path="/courses" element={<Catalog />} />
          <Route path="/course/:id" element={<Course />} />
          <Route path="/lesson/:id" element={<Lesson />} />
          <Route path="/tests" element={<Practice />} />
          <Route path="/quiz/:id" element={<Quiz />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/updates" element={<Notifications />} />
          <Route
            path="/profile"
            element={
              <Profile
                user={session.user}
                logout={logout}
                refresh={async () => setSession(await api("/me"))}
              />
            }
          />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/community" element={<Community />} />
          <Route path="/live" element={<LiveSessions />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/support" element={<Support />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!immersive && (
        <nav className="mobile-bottom-nav" aria-label="Learner navigation">
          {tabs.map(([path, label, icon]) => (
            <NavLink key={path} to={path} end={path === "/"}>
              <Icon name={icon} size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
function AccessNotice({ me }: { me: Row }) {
  if (
    me.activation === "Active" &&
    me.subscriptions.some((s: Row) => s.status === "Active")
  )
    return null;
  return (
    <Link to="/subscription" className="access-notice">
      <span className="soft-icon">
        <Icon name="ShieldCheck" size={21} />
      </span>
      <div>
        <strong>
          {me.activation !== "Active"
            ? "Your account is awaiting activation"
            : "Let’s get your learning started"}
        </strong>
        <p>
          {me.activation !== "Active"
            ? "Your coaching owner will review your package and activate access."
            : "Choose a package. Your coaching verifies payment and approves access."}
        </p>
      </div>
      <Icon name="ChevronRight" size={17} />
    </Link>
  );
}
function CourseCard({ c, compact = false }: { c: Row; compact?: boolean }) {
  return (
    <Link
      to={"/course/" + c.id}
      className={"learner-course-card " + (compact ? "compact" : "")}
    >
      <div className="course-image-wrap">
        <CoursePhoto course={c} />
        <span className="image-badge">{c.category}</span>
        {c.accessible && (
          <span className="included-badge">
            <Icon name="Check" size={12} />
            Included
          </span>
        )}
      </div>
      <div className="course-card-body">
        <span className="eyebrow">{c.batch || c.level}</span>
        <h3>{c.title}</h3>
        <p>{c.instructor}</p>
        <div className="course-meta">
          <span>
            <Icon name="BookOpen" size={14} />
            {c.total} lessons
          </span>
          <span>{c.language}</span>
        </div>
        {c.accessible ? (
          <div className="course-progress">
            <div className="progress-track">
              <span style={{ width: c.progress + "%" }} />
            </div>
            <small>{c.progress}% complete</small>
          </div>
        ) : (
          <div className="course-card-footer">
            <strong>Explore course</strong>
            <Icon name="ArrowUpRight" size={17} />
          </div>
        )}
      </div>
    </Link>
  );
}
function Home({ user }: { user: Row }) {
  const d = useData("/coaching/catalog"),
    me = useData("/coaching/me");
  const active = d.data?.filter((c: Row) => c.accessible) || [],
    continueCourse =
      active.find((c: Row) => c.progress > 0 && c.progress < 100) || active[0];
  return (
    <>
      <div className="home-greeting">
        <span className="eyebrow">A FRESH CHANCE TO MOVE FORWARD</span>
        <h1>
          Hello, {user.name.split(" ")[0]}{" "}
          <span className="greeting-dot">✦</span>
        </h1>
        <p>What will you discover today?</p>
      </div>
      {me.data && <AccessNotice me={me.data} />}
      <section className="learner-hero">
        <div>
          <span className="hero-chip">
            <span />
            YOUR NEXT CHAPTER
          </span>
          <h2>
            Big dreams.
            <br />
            Small, steady steps.
          </h2>
          <p>
            Build your concepts.
            <br />
            Find your confidence.
          </p>
          <Link to="/courses" className="btn">
            Explore courses <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
        <img
          src="/images/physics.png"
          alt="Learn physics with expert Indian faculty"
        />
        <span className="hero-photo-label">
          <Icon name="GraduationCap" size={16} />
          Learn with your coaching
        </span>
      </section>
      <div className="quick-actions">
        <Link to="/live">
          <span className="quick-icon blue">
            <Icon name="Video" />
          </span>
          <span>Live classes</span>
        </Link>
        <Link to="/tests">
          <span className="quick-icon amber">
            <Icon name="ClipboardList" />
          </span>
          <span>Practice</span>
        </Link>
        <Link to="/downloads">
          <span className="quick-icon lavender">
            <Icon name="Download" />
          </span>
          <span>Downloads</span>
        </Link>
        <Link to="/subscription">
          <span className="quick-icon teal">
            <Icon name="CreditCard" />
          </span>
          <span>My package</span>
        </Link>
      </div>
      {continueCourse && (
        <>
          <SectionTitle
            title="Keep your momentum"
            to={"/course/" + continueCourse.id}
            label="Continue"
          />
          <Link className="continue-card" to={"/course/" + continueCourse.id}>
            <CoursePhoto course={continueCourse} />
            <div>
              <span className="eyebrow">
                {continueCourse.category} · {continueCourse.batch}
              </span>
              <h3>{continueCourse.title}</h3>
              <p>
                {continueCourse.completed} of {continueCourse.total} lessons
                completed
              </p>
              <div className="progress-track">
                <span style={{ width: continueCourse.progress + "%" }} />
              </div>
            </div>
            <span className="continue-play">
              <Icon name="Play" size={20} />
            </span>
          </Link>
        </>
      )}
      <SectionTitle
        title="Your ambition, your path"
        text="Find a course that fits your goal"
        to="/courses"
      />
      {d.error ? (
        <ErrorState error={d.error} retry={d.reload} />
      ) : !d.data ? (
        <Loading />
      ) : (
        <div className="home-course-grid">
          {d.data.slice(0, 4).map((c: Row) => (
            <CourseCard key={c.id} c={c} />
          ))}
        </div>
      )}
      <div className="study-tip">
        <span>✦</span>
        <div>
          <strong>A little advice for today</strong>
          <p>
            Understand one concept well. Then practise it without looking at the
            answer.
          </p>
        </div>
      </div>
    </>
  );
}
function Catalog() {
  const d = useData("/coaching/catalog"),
    [filter, setFilter] = useState("All"),
    [query, setQuery] = useState("");
  const courses = (d.data || []).filter(
    (c: Row) =>
      (filter === "All" ||
        (filter === "My courses" && c.accessible) ||
        c.category === filter) &&
      c.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="mobile-page-heading">
        <span className="eyebrow">LEARN WITH PURPOSE</span>
        <h1>Find your next step</h1>
        <p>Your goals deserve a clear path.</p>
      </div>
      <label className="search-field mobile-search">
        <Icon name="Search" size={19} />
        <input
          aria-label="Search courses"
          placeholder="Search courses, subjects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="filter-tabs mobile-filters">
        {["All", "My courses", "JEE", "NEET", "UPSC", "CBSE"].map((f) => (
          <button
            key={f}
            className={f === filter ? "selected" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {d.error ? (
        <ErrorState error={d.error} />
      ) : !d.data ? (
        <Loading />
      ) : (
        <div className="learner-catalog-grid">
          {courses.map((c: Row) => (
            <CourseCard key={c.id} c={c} />
          ))}
          {!courses.length && (
            <Empty
              title="A new path is on its way"
              text="Try another subject or explore all courses."
            />
          )}
        </div>
      )}
    </>
  );
}
function Course() {
  const { id } = useParams(),
    d = useData("/courses/" + id),
    catalog = useData("/coaching/catalog"),
    toast = useToast(),
    navigate = useNavigate();
  if (d.error) return <ErrorState error={d.error} retry={d.reload} />;
  if (!d.data) return <Loading />;
  const c = d.data,
    access = catalog.data?.find((r: Row) => r.id === id)?.accessible;
  const begin = async () => {
    try {
      if (!c.joined) await post("/courses/" + id + "/enrolments");
      navigate(
        "/lesson/" +
          (c.lessons.find((l: Row) => !l.completed) || c.lessons[0])?.id,
      );
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };
  return (
    <>
      <Back to="/courses" label="All courses" />
      <div className="course-detail-cover">
        <CoursePhoto course={c} />
        <span className="image-badge">
          {c.category} · {c.level}
        </span>
      </div>
      <div className="mobile-course-heading">
        <span className="eyebrow">{c.batch}</span>
        <h1>{c.title}</h1>
        <p>{c.description}</p>
        <div className="faculty-line">
          <Avatar name={c.instructor} />
          <div>
            <strong>{c.instructor}</strong>
            <small>{c.language}</small>
          </div>
        </div>
        <div className="detail-chips">
          <span>
            <Icon name="BookOpen" size={15} />
            {c.lessons.length} lessons
          </span>
          <span>
            <Icon name="Globe2" size={15} />
            {c.language}
          </span>
          <span>
            <Icon name="ShieldCheck" size={15} />
            Coaching approved
          </span>
        </div>
        {access ? (
          <button className="btn primary full" onClick={begin}>
            <Icon name="Play" size={18} />
            {c.lessons.some((l: Row) => l.completed)
              ? "Continue learning"
              : "Start learning"}
          </button>
        ) : (
          <Link to="/plans" className="btn primary full">
            <Icon name="LockKeyhole" size={17} />
            View access packages
          </Link>
        )}
      </div>
      <SectionTitle title="What you’ll learn" />
      <div className="learning-outcomes">
        {c.outcomes.split(";").map((o: string) => (
          <p key={o}>
            <Icon name="CircleCheck" size={17} />
            {o.trim()}
          </p>
        ))}
      </div>
      <SectionTitle
        title="Your learning path"
        text={c.lessons.length + " lessons · Learn at your pace"}
      />
      <div className="mobile-curriculum">
        {c.lessons.map((l: Row, i: number) => (
          <button
            key={l.id}
            className="mobile-lesson-row"
            disabled={!access}
            onClick={async () => {
              try {
                if (!c.joined) await post("/courses/" + id + "/enrolments");
                navigate("/lesson/" + l.id);
              } catch (e) {
                toast((e as Error).message, "error");
              }
            }}
          >
            <span className={"lesson-number " + (l.completed ? "done" : "")}>
              {l.completed ? (
                <Icon name="Check" size={16} />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <div>
              <strong>{l.title}</strong>
              <small>
                {l.type} · {l.duration} min
              </small>
            </div>
            <Icon name={access ? "ChevronRight" : "LockKeyhole"} size={17} />
          </button>
        ))}
      </div>
      <p className="subtle-note">
        Learning opens after your package is approved and your account is
        activated. Sample material demonstrates the course experience.
      </p>
    </>
  );
}
function Lesson() {
  const { id } = useParams(),
    d = useData("/lessons/" + id),
    c = useData(d.data ? "/courses/" + d.data.courseId : ""),
    learning = useData("/me/learning"),
    [notes, setNotes] = useState(""),
    [tab, setTab] = useState("Lesson"),
    toast = useToast(),
    navigate = useNavigate();
  useEffect(() => {
    setNotes("");
    setTab("Lesson");
  }, [id]);
  if (d.error)
    return (
      <>
        <Back to="/courses" label="My courses" />
        <ErrorState error={d.error} retry={d.reload} />
        <Link to="/subscription" className="btn primary">
          Check my subscription
        </Link>
      </>
    );
  if (!d.data) return <Loading />;
  const l = d.data,
    index = c.data?.lessons.findIndex((v: Row) => v.id === id),
    next = c.data?.lessons[index + 1],
    completed = learning.data?.progress.some(
      (p: Row) => p.lesson_id === id && p.completed,
    );
  return (
    <div className="mobile-lesson">
      <header>
        <Back to={"/course/" + l.courseId} label="Course" />
        <span>
          {l.type} · {l.duration} min
        </span>
      </header>
      <span className="eyebrow">{l.module}</span>
      <h1>{l.title}</h1>
      <div className="filter-tabs page-tabs">
        {["Lesson", "My notes"].map((t) => (
          <button
            className={t === tab ? "selected" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Lesson" ? (
        <>
          {l.assetIds?.map((assetId: string) => (
            <ResourceViewer key={assetId} assetId={assetId} />
          ))}
          <article className="lesson-reading">
            {l.assetIds?.length > 0 && (
              <h2>
                {l.type === "Video" ? "Transcript & key ideas" : "Study notes"}
              </h2>
            )}
            {l.content.split(/\n\n/).map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
          </article>
          {l.downloadable && (
            <button
              className="btn"
              onClick={async () => {
                try {
                  saveDownload(await api("/lessons/" + id + "/offline"));
                  toast("Reading saved for up to 24 hours.");
                } catch (e) {
                  toast((e as Error).message, "error");
                }
              }}
            >
              <Icon name="Download" size={17} />
              Save reading offline
            </button>
          )}
        </>
      ) : (
        <section className="lesson-notes">
          <h2>Your own words. Your understanding.</h2>
          <textarea
            aria-label="My lesson notes"
            placeholder="What’s the key idea you want to remember?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            className="btn primary"
            disabled={!notes.trim()}
            onClick={async () => {
              try {
                await note(id!, notes);
                setNotes("");
                learning.reload();
                toast("Note saved.");
              } catch (e) {
                toast((e as Error).message, "error");
              }
            }}
          >
            Save note
          </button>
          {learning.data?.notes
            .filter((n: Row) => n.lessonId === id)
            .map((n: Row) => (
              <div className="saved-note" key={n.id}>
                {n.text}
              </div>
            ))}
        </section>
      )}
      <div className="lesson-actions">
        <button
          className="btn primary full"
          onClick={async () => {
            try {
              await progress(id!, true, 0);
              learning.reload();
              toast("Progress saved.");
              if (next) navigate("/lesson/" + next.id);
              else navigate("/course/" + l.courseId);
            } catch (e) {
              toast((e as Error).message, "error");
            }
          }}
        >
          <Icon name={completed ? "Check" : "CircleCheck"} size={18} />
          {next
            ? "Complete & next lesson"
            : completed
              ? "Back to course"
              : "Complete lesson"}
        </button>
        <small>Your progress syncs with your coaching dashboard.</small>
      </div>
    </div>
  );
}
function Plans() {
  const d = useData("/coaching/packages"),
    me = useData("/coaching/me"),
    [selected, setSelected] = useState<Row | null>(null),
    [method, setMethod] = useState("Cash"),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState(""),
    navigate = useNavigate();
  return (
    <>
      <Back to="/subscription" label="My subscription" />
      <div className="mobile-page-heading">
        <span className="eyebrow">INVEST IN YOUR NEXT STEP</span>
        <h1>A plan for your ambition</h1>
        <p>Choose your course. Learn with your coaching.</p>
      </div>
      {d.error ? (
        <ErrorState error={d.error} />
      ) : !d.data ? (
        <Loading />
      ) : (
        <div className="mobile-package-grid">
          {d.data.map((p: Row, i: number) => (
            <article
              className={
                "package-card " + (p.id === "pkg-all" ? "featured" : "")
              }
              key={p.id}
            >
              <div className="card-top">
                <span className="soft-icon">
                  <Icon name={p.id === "pkg-all" ? "Sparkles" : "BookOpen"} />
                </span>
                {p.id === "pkg-all" && (
                  <span className="plan-label">MORE ROOM TO EXPLORE</span>
                )}
              </div>
              <h2>{p.name}</h2>
              <p>{p.description}</p>
              <div className="package-price">
                {money(p.price)}
                <small>/ {p.validityDays} days</small>
              </div>
              <ul>
                <li>
                  <Icon name="Check" size={16} />
                  {p.courseIds.length} included course
                  {p.courseIds.length > 1 ? "s" : ""}
                </li>
                <li>
                  <Icon name="Check" size={16} />
                  Videos & chapter resources
                </li>
                <li>
                  <Icon name="Check" size={16} />
                  Practice & progress tracking
                </li>
              </ul>
              <button
                className="btn primary full"
                onClick={() => {
                  setSelected(p);
                  setMethod("Cash");
                  setErr("");
                }}
              >
                Choose this package <Icon name="ArrowRight" size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
      <div className="how-access-works">
        <Icon name="ShieldCheck" />
        <p>
          Choose a package → complete payment → your coaching verifies it →
          learning opens once your account is active.
        </p>
      </div>
      {selected && (
        <Modal
          title="Request your package"
          subtitle={selected.name + " · " + money(selected.price)}
          onClose={() => setSelected(null)}
        >
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setErr("");
              try {
                await post("/coaching/requests", {
                  packageId: selected.id,
                  paymentMethod: method,
                });
                navigate("/subscription");
              } catch (e) {
                setErr((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="note-box">
              <strong>Payment goes to your coaching centre.</strong>
              <p>{me.data?.settings.paymentInstructions}</p>
            </div>
            <label>
              How will you pay?
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank transfer</option>
              </select>
            </label>
            <p className="subtle-note">
              This request does not collect a payment. Share your payment
              reference on the next screen. Your coaching owner confirms access.
            </p>
            {err && (
              <p role="alert" className="form-error">
                {err}
              </p>
            )}
            <button className="btn primary full" disabled={busy}>
              {busy ? "Sending…" : "Send package request"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
function Subscription() {
  const d = useData("/coaching/me"),
    [receipt, setReceipt] = useState(""),
    [request, setRequest] = useState<Row | null>(null),
    toast = useToast();
  useEffect(() => {
    const t = setInterval(d.reload, 30000);
    return () => clearInterval(t);
  }, []);
  if (d.error) return <ErrorState error={d.error} retry={d.reload} />;
  if (!d.data) return <Loading />;
  const me = d.data,
    active = me.subscriptions.filter((s: Row) => s.status === "Active");
  return (
    <>
      <Back to="/profile" label="My profile" />
      <div className="mobile-page-heading">
        <span className="eyebrow">YOUR LEARNING ACCESS</span>
        <h1>My subscription</h1>
        <p>Every detail. No guesswork.</p>
      </div>
      <div className="activation-card">
        <span className="soft-icon">
          <Icon name="ShieldCheck" />
        </span>
        <div>
          <strong>Account activation</strong>
          <p>
            {me.activation === "Active"
              ? "Your coaching has activated your account."
              : "Your coaching owner needs to activate your account."}
          </p>
        </div>
        <Badge>{me.activation}</Badge>
      </div>
      {active.length ? (
        active.map((s: Row) => (
          <section className="subscription-card" key={s.id}>
            <span className="hero-chip">
              <Icon name="Check" size={15} />
              APPROVED PACKAGE
            </span>
            <h2>{s.package_name}</h2>
            <p>
              {s.courseIds.length} course{s.courseIds.length > 1 ? "s" : ""}{" "}
              included
            </p>
            <div>
              <span>
                Valid until<strong>{date(s.expires)}</strong>
              </span>
              <span>
                Paid<strong>{money(s.paidAmount)}</strong>
              </span>
            </div>
            <Link className="btn" to="/courses">
              Go to my courses <Icon name="ArrowRight" size={16} />
            </Link>
          </section>
        ))
      ) : (
        <div className="no-plan">
          <Icon name="BookOpen" size={35} />
          <h2>Your next chapter is waiting</h2>
          <p>Choose a package to start learning with your coaching centre.</p>
        </div>
      )}
      <Link className="btn primary full" to="/plans">
        {active.length ? "Explore packages & renew" : "Choose my package"}
        <Icon name="ArrowRight" size={17} />
      </Link>
      <SectionTitle title="My requests" />
      {me.requests.length ? (
        me.requests.map((r: Row) => (
          <section className="request-card" key={r.id}>
            <div className="card-top">
              <strong>{r.package.name}</strong>
              <Badge>{r.status}</Badge>
            </div>
            <p>
              {money(r.package.price_paise / 100)} · {r.payment_method} ·{" "}
              {date(r.created)}
            </p>
            {r.payment_reference && (
              <small>Reference: {r.payment_reference}</small>
            )}
            {r.reason && (
              <div className="review-note">Owner note: {r.reason}</div>
            )}
            {r.status === "Pending payment" && (
              <button
                className="btn"
                onClick={() => {
                  setRequest(r);
                  setReceipt("");
                }}
              >
                I’ve paid · submit details <Icon name="ArrowRight" size={16} />
              </button>
            )}
            {r.status === "Pending approval" && (
              <div className="pending-message">
                <Icon name="Clock3" size={17} />
                Your coaching is reviewing this payment.
              </div>
            )}
          </section>
        ))
      ) : (
        <p className="muted">Your package requests will appear here.</p>
      )}
      {me.subscriptions.some((s: Row) => s.status !== "Active") && (
        <>
          <SectionTitle title="Other subscriptions" />
          {me.subscriptions
            .filter((s: Row) => s.status !== "Active")
            .map((s: Row) => (
              <div key={s.id} className="list-row">
                <div>
                  <strong>{s.package_name}</strong>
                  <small>
                    {date(s.starts)} – {date(s.expires)}
                  </small>
                </div>
                <Badge>{s.status}</Badge>
              </div>
            ))}
        </>
      )}
      <p className="subtle-note">
        Need help? Contact {me.settings.name} at {me.settings.supportPhone}.
      </p>
      {request && (
        <Modal
          title="Share your payment details"
          subtitle={request.package.name}
          onClose={() => setRequest(null)}
        >
          <div className="note-box">
            <p>{me.settings.paymentInstructions}</p>
            {me.settings.upiId && <strong>UPI: {me.settings.upiId}</strong>}
          </div>
          <AssetUpload purpose="receipt" onUpload={(a) => setReceipt(a.id)} />
          {receipt && (
            <p className="success-text">
              <Icon name="Check" size={16} />
              Receipt attached
            </p>
          )}
          <Form
            fields={[
              {
                name: "reference",
                label: "UPI / bank reference or cash receipt number",
                required: true,
                help: "At least 6 characters. Your coaching will verify this before approval.",
              },
            ]}
            label="Submit for verification"
            onSubmit={async (v) => {
              await post("/coaching/requests/" + request.id + "/payment", {
                reference: v.reference,
                ...(receipt ? { receiptId: receipt } : {}),
              });
              setRequest(null);
              d.reload();
              toast("Payment details sent for owner verification.");
            }}
          />
        </Modal>
      )}
    </>
  );
}
function Practice() {
  const d = useData("/coaching/catalog");
  return (
    <>
      <div className="mobile-page-heading">
        <span className="eyebrow">UNDERSTAND. PRACTISE. GROW.</span>
        <h1>Make your concepts count</h1>
        <p>A little practice tells you what to revise next.</p>
      </div>
      <div className="practice-hero">
        <Icon name="Brain" size={42} />
        <div>
          <h2>Progress over perfection.</h2>
          <p>Topic practice · 15 minutes · 3 attempts</p>
        </div>
      </div>
      <SectionTitle title="Course practice" />
      {d.error ? (
        <ErrorState error={d.error} />
      ) : !d.data ? (
        <Loading />
      ) : (
        d.data.map((c: Row) => (
          <Link
            key={c.id}
            to={c.accessible ? "/quiz/" + c.id : "/course/" + c.id}
            className="practice-row"
          >
            <CoursePhoto course={c} />
            <div>
              <span className="eyebrow">{c.category}</span>
              <h3>{c.title}</h3>
              <p>
                {c.accessible
                  ? "Start your chapter practice"
                  : "Included with an approved package"}
              </p>
            </div>
            <Icon
              name={c.accessible ? "ChevronRight" : "LockKeyhole"}
              size={20}
            />
          </Link>
        ))
      )}
      <SectionTitle title="More ways to learn" />
      <div className="profile-links">
        <Link to="/assignments">
          <Icon name="NotebookPen" />
          Assignments
          <Icon name="ChevronRight" size={17} />
        </Link>
        <Link to="/community">
          <Icon name="MessagesSquare" />
          Ask & discuss
          <Icon name="ChevronRight" size={17} />
        </Link>
      </div>
    </>
  );
}
function Profile({
  user,
  logout,
  refresh,
}: {
  user: Row;
  logout: () => void;
  refresh: () => Promise<void>;
}) {
  const [edit, setEdit] = useState(false),
    toast = useToast();
  return (
    <>
      <div className="profile-hero">
        <Avatar name={user.name} />
        <h1>{user.name}</h1>
        <p>{user.email}</p>
        <Badge>{user.status}</Badge>
        <button className="text-link" onClick={() => setEdit(true)}>
          Edit profile <Icon name="Pencil" size={14} />
        </button>
      </div>
      <div className="profile-links">
        {[
          ["/subscription", "My subscription", "CreditCard"],
          ["/downloads", "Offline readings", "Download"],
          ["/certificates", "Certificates", "Award"],
          ["/live", "Live classes", "Video"],
          ["/support", "Help from my coaching", "LifeBuoy"],
          ["/assistant", "Study companion", "Sparkles"],
        ].map(([path, label, icon]) => (
          <Link to={path} key={path}>
            <span className="soft-icon">
              <Icon name={icon} />
            </span>
            {label}
            <Icon name="ChevronRight" size={18} />
          </Link>
        ))}
      </div>
      <div className="profile-footer">
        <Icon name="GraduationCap" size={24} />
        <strong>One step closer. Every day.</strong>
        <p>Qubit Coaching · Made for your learning journey.</p>
        <button className="btn" onClick={logout}>
          <Icon name="LogOut" size={17} />
          Sign out
        </button>
        {isNative && <small>Connected to {backendUrl()}</small>}
      </div>
      {edit && (
        <Modal title="Your profile" onClose={() => setEdit(false)}>
          <Form
            fields={[{ name: "name", label: "Full name", required: true }]}
            initial={user}
            onSubmit={async (v) => {
              await patch("/me", v);
              await refresh();
              setEdit(false);
              toast("Profile updated.");
            }}
          />
        </Modal>
      )}
    </>
  );
}
