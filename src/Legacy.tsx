import React, { useEffect, useState, useRef } from "react";
import {
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  YAxis,
} from "recharts";
import {
  api,
  post,
  patch,
  Icon,
  Brand,
  Avatar,
  Badge,
  Empty,
  Loading,
  ErrorState,
  useData as useSourceData,
  useToast,
  Modal,
  Form,
  Art,
  download,
  PageHeading,
  cacheKey,
} from "./ui";
import type { Row } from "./ui";
import {
  downloads,
  saveDownload,
  removeDownload,
  queue,
  progress,
  note,
  sync,
  clearPersonalCache,
} from "./offline";
function useData(path: string, dependency: unknown = 0) {
  const result = useSourceData(path, dependency),
    catalog = useSourceData(
      path.startsWith("/learning/resources/") ? "/coaching/catalog" : "",
    );
  if (
    [
      "/learning/resources/assignments",
      "/learning/resources/sessions",
      "/learning/resources/discussions",
    ].includes(path) &&
    result.data &&
    catalog.data
  )
    return {
      ...result,
      data: result.data.filter(
        (r: Row) =>
          !r.courseId || catalog.data.some((c: Row) => c.id === r.courseId),
      ),
    };
  return result;
}
const mainNav = [
  ["/", "Home", "House"],
  ["/explore", "Explore", "Compass"],
  ["/learning", "My learning", "BookOpen"],
  ["/progress", "My progress", "ChartNoAxesCombined"],
  ["/assistant", "Learning companion", "Sparkles"],
];
export default function App() {
  const [user, setUser] = useState<Row | null>(null),
    [loading, setLoading] = useState(true),
    [online, setOnline] = useState(navigator.onLine),
    [pending, setPending] = useState(queue().length),
    [menu, setMenu] = useState(false);
  const loc = useLocation(),
    nav = useNavigate(),
    toast = useToast();
  useEffect(() => {
    api("/me")
      .then((d) => setUser(d.user))
      .catch(() => {
        if (!navigator.onLine) {
          const p = localStorage.getItem("qubit-profile");
          if (p) setUser(JSON.parse(p));
        }
      })
      .finally(() => setLoading(false));
    const network = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) sync();
    };
    const cache = () => setPending(queue().length);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    window.addEventListener("qubit-cache", cache);
    return () => {
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      window.removeEventListener("qubit-cache", cache);
    };
  }, []);
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  useEffect(() => {
    if (user && online) sync();
  }, [user?.id, online]);
  const updateUser = (u: Row) => {
    setUser(u);
    localStorage.setItem("qubit-profile", JSON.stringify(u));
  };
  useEffect(() => {
    document.documentElement.dataset.theme =
      user?.preferences?.theme || "light";
    document.documentElement.dataset.text =
      user?.preferences?.textSize || "standard";
  }, [user?.preferences?.theme, user?.preferences?.textSize]);
  if (loading) return <Loading />;
  if (!user) return <Welcome onLogin={(d) => setUser(d.user)} />;
  const player =
    loc.pathname.startsWith("/lesson/") || loc.pathname.startsWith("/quiz/");
  const title =
    mainNav.find((n) => n[0] === loc.pathname)?.[1] ||
    (
      {
        "/notifications": "Your inbox",
        "/downloads": "Offline learning",
        "/community": "Learning together",
        "/support": "A little help",
        "/profile": "Your space",
        "/assignments": "Your assignments",
        "/certificates": "Your achievements",
        "/live": "Live learning",
      } as Row
    )[loc.pathname] ||
    "Your learning journey";
  return (
    <div className={"learner-shell " + (player ? "focus-shell" : "")}>
      <aside className={"learner-sidebar " + (menu ? "open" : "")}>
        <Link to="/" aria-label="Qubit home">
          <Brand />
        </Link>
        <span className="learner-sidebar-tag">YOUR SPACE TO GROW</span>
        <nav>
          {mainNav.map(([path, name, icon]) => (
            <NavLink key={path} to={path} end={path === "/"}>
              <Icon name={icon} />
              {name}
              {path === "/assistant" && (
                <span className="companion-star">✦</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <nav className="secondary-nav">
          {[
            ["/assignments", "Assignments", "ClipboardList"],
            ["/live", "Live sessions", "Video"],
            ["/community", "Community", "MessagesSquare"],
            ["/downloads", "Downloads", "Download"],
            ["/certificates", "Certificates", "Award"],
          ].map(([path, name, icon]) => (
            <NavLink key={path} to={path}>
              <Icon name={icon} size={18} />
              {name}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-goal">
          <Icon name="Sprout" size={24} />
          <h3>A little, every day.</h3>
          <p>Your next big idea starts with a small step.</p>
          <Link to="/profile">
            Set your learning goal
            <Icon name="ArrowUpRight" size={14} />
          </Link>
        </div>
        <div className="learner-sidebar-bottom">
          <Link to="/support">
            <Icon name="LifeBuoy" size={18} />
            Help & support
          </Link>
          <Link className="learner-user" to="/profile">
            <Avatar name={user.name} />
            <span>
              <strong>{user.name}</strong>
              <small>Your personal learning space</small>
            </span>
            <Icon name="ChevronRight" size={15} />
          </Link>
        </div>
      </aside>
      {menu && <div className="nav-scrim" onClick={() => setMenu(false)} />}
      <div className="learner-main">
        <header className="learner-topbar">
          <div>
            <button
              className="icon-btn mobile-menu"
              aria-label="Open menu"
              onClick={() => setMenu(!menu)}
            >
              <Icon name="Menu" />
            </button>
            <span className="learner-breadcrumb">
              Your space <Icon name="ChevronRight" size={13} />
              <strong>{title}</strong>
            </span>
            <Link className="mobile-brand" to="/">
              <Brand small />
            </Link>
          </div>
          <div>
            <span className="learner-date">A good day to learn something.</span>
            <Link
              to="/explore"
              className="icon-btn"
              aria-label="Search courses"
            >
              <Icon name="Search" size={19} />
            </Link>
            <Link
              to="/notifications"
              className="icon-btn"
              aria-label="Notifications"
            >
              <Icon name="Bell" size={20} />
              <i className="notification-dot" />
            </Link>
            <Link to="/profile" aria-label="Your profile">
              <Avatar name={user.name} />
            </Link>
          </div>
        </header>
        {(!online || pending > 0) && (
          <div
            className={"connectivity-banner " + (!online ? "offline" : "")}
            role="status"
          >
            <Icon name={online ? "CloudUpload" : "WifiOff"} size={16} />
            {online
              ? `${pending} change${pending === 1 ? "" : "s"} waiting to sync.`
              : "You’re offline. Downloaded lessons and local notes are available."}
            <Link to="/downloads">
              {online ? "Manage sync" : "View downloads"}
              <Icon name="ArrowRight" size={13} />
            </Link>
          </div>
        )}
        <main className="learner-content">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/learning" element={<MyLearning />} />
            <Route path="/course/:id" element={<Course />} />
            <Route path="/lesson/:id" element={<Lesson />} />
            <Route path="/quiz/:id" element={<Quiz />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/progress" element={<Progress user={user} />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/community" element={<Community />} />
            <Route path="/live" element={<LiveSessions />} />
            <Route path="/support" element={<Support />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route
              path="/profile"
              element={
                <Profile
                  user={user}
                  onUpdate={updateUser}
                  onLogout={async () => {
                    if (
                      queue().length &&
                      !confirm(
                        "You have unsynced changes. Signing out removes local downloads and pending changes. Continue?",
                      )
                    )
                      return;
                    await post("/auth/logout");
                    clearPersonalCache();
                    setUser(null);
                  }}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <footer className="learner-footer">
            <Brand small />
            <span>A little learning. Limitless possibility.</span>
            <span>YOUR NEXT CHAPTER STARTS HERE.</span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        {mainNav.slice(0, 4).map(([path, name, icon]) => (
          <NavLink key={path} to={path} end={path === "/"}>
            <Icon name={icon} size={21} />
            <span>
              {name === "My learning"
                ? "Learning"
                : name === "My progress"
                  ? "Progress"
                  : name}
            </span>
          </NavLink>
        ))}
        <NavLink to="/profile">
          <Icon name="CircleUserRound" size={21} />
          <span>You</span>
        </NavLink>
      </nav>
    </div>
  );
}
function Welcome({ onLogin }: { onLogin: (d: Row) => void }) {
  const [mode, setMode] = useState("welcome"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const toast = useToast();
  const demo = async () => {
    setBusy(true);
    try {
      onLogin(
        await post("/auth/login", {
          email: "learner@qubit.demo",
          password: "QubitDemo2026!",
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="learner-welcome">
      <div className="welcome-story">
        <Brand />
        <span className="welcome-story-tag">A SPACE FOR YOUR NEXT CHAPTER</span>
        <div className="welcome-illustration">
          <Art color="sage" />
          <span className="welcome-float">
            <Icon name="Sparkles" size={16} />
            Curiosity looks good on you.
          </span>
        </div>
        <h1>
          Big ideas start
          <br />
          with a little <em>curiosity.</em>
        </h1>
        <p>
          Discover a calmer, more meaningful way to learn.
          <br />
          Your next possibility is waiting.
        </p>
        <div className="welcome-proof">
          <div className="avatar-stack">
            {["Olivia Rhye", "Lana Steiner", "Jamie Parker"].map((n) => (
              <Avatar key={n} name={n} />
            ))}
          </div>
          <span>Made for curious minds, like yours.</span>
        </div>
      </div>
      <div className="welcome-access">
        <span className="badge neutral">INTERACTIVE PROTOTYPE</span>
        <h2>
          {mode === "signup"
            ? "Your next chapter starts here."
            : mode === "reset"
              ? "Let’s find your way back."
              : "Make room for possibility."}
        </h2>
        <p>
          {mode === "signup"
            ? "Create your personal learning space."
            : mode === "reset"
              ? "Request help getting back into your account."
              : "A little learning, a little momentum. A whole lot of you."}
        </p>
        {mode === "signup" ? (
          <Form
            fields={[
              { name: "name", label: "Your name", required: true },
              { name: "email", label: "Email", type: "email", required: true },
              {
                name: "password",
                label: "Password · at least 12 characters",
                type: "password",
                required: true,
              },
              {
                name: "consent",
                label: "I agree to the prototype terms and privacy notice.",
                type: "checkbox",
              },
            ]}
            onSubmit={async (v) => {
              const d = await post("/auth/register", v);
              toast(d.message);
              setMode("signin");
            }}
            label="Create your space"
          />
        ) : mode === "reset" ? (
          <Form
            fields={[
              {
                name: "email",
                label: "Email address",
                type: "email",
                required: true,
              },
            ]}
            onSubmit={async (v) =>
              toast((await post("/auth/password-reset", v)).message)
            }
            label="Request recovery"
          />
        ) : mode === "signin" ? (
          <>
            <Form
              fields={[
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
                },
              ]}
              onSubmit={async (v) => onLogin(await post("/auth/login", v))}
              label="Welcome back"
            />
            <button className="text-link" onClick={() => setMode("reset")}>
              Forgot your password?
            </button>
          </>
        ) : (
          <>
            <button
              className="btn primary full welcome-start"
              onClick={demo}
              disabled={busy}
            >
              {busy ? "Opening your space…" : "Explore the learner demo"}
              <Icon name="ArrowRight" size={18} />
            </button>
            <div className="welcome-features">
              {[
                ["BookOpen", "Courses worth your curiosity"],
                ["Compass", "A clear next step, always"],
                ["Sprout", "Progress at your own pace"],
              ].map(([icon, text]) => (
                <div key={icon}>
                  <Icon name={icon} size={18} />
                  {text}
                  <Icon name="Check" size={14} />
                </div>
              ))}
            </div>
          </>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="welcome-switch">
          {mode === "welcome" ? (
            <>
              <button onClick={() => setMode("signin")}>Sign in</button>
              <span>or</span>
              <button onClick={() => setMode("signup")}>
                Create an account
                <Icon name="ArrowUpRight" size={14} />
              </button>
            </>
          ) : (
            <button onClick={() => setMode("welcome")}>
              <Icon name="ArrowLeft" size={14} />
              Back to the demo
            </button>
          )}
        </div>
        <small className="welcome-privacy">
          <Icon name="ShieldCheck" size={14} />
          Synthetic learning data. No payment or external AI service.
        </small>
      </div>
    </div>
  );
}
function CourseCard({ course: c, index = 0 }: { course: Row; index?: number }) {
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  return (
    <article className="learner-course-card">
      <Link to={"/course/" + c.id} className="learner-course-cover">
        <Art color={c.color} variant={index} />
        <span className="course-cover-label">{c.category}</span>
        <span className="art-corner">
          Q / {String(index + 1).padStart(2, "0")}
        </span>
      </Link>
      <button
        className={"save-course " + (saved ? "saved" : "")}
        aria-label={saved ? "Remove saved course" : "Save course"}
        onClick={async () => {
          try {
            await api("/me/saved/" + c.id, {
              method: saved ? "DELETE" : "PUT",
              ...(!saved
                ? { body: JSON.stringify({ courseId: c.id, title: c.title }) }
                : {}),
            });
            setSaved(!saved);
            toast(
              saved
                ? "Removed from saved courses."
                : "A little inspiration, saved for later.",
            );
          } catch (e) {
            toast((e as Error).message, "error");
          }
        }}
      >
        <Icon name={saved ? "BookmarkCheck" : "Bookmark"} size={17} />
      </button>
      <div className="learner-course-body">
        <div className="learner-course-meta">
          <span>{c.level}</span>
          <span>
            <Icon name="Star" size={11} />
            {c.rating || "New"}
          </span>
        </div>
        <Link to={"/course/" + c.id}>
          <h3>{c.title}</h3>
        </Link>
        <div className="learner-instructor">
          <Avatar name={c.instructor} />
          <span>{c.instructor}</span>
        </div>
        {c.joined ? (
          <>
            <div className="progress-label">
              <span>
                {c.completed} of {c.total} lessons
              </span>
              <strong>{c.progress}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: c.progress + "%" }} />
            </div>
            <Link className="resume-link" to={"/course/" + c.id}>
              {c.progress === 100 ? "Revisit course" : "Continue your journey"}
              <Icon name="ArrowRight" size={16} />
            </Link>
          </>
        ) : (
          <div className="learner-course-bottom">
            <span>
              <Icon name="Clock3" size={13} />
              {c.duration}
            </span>
            <Link to={"/course/" + c.id}>
              {c.access === "Open" ? "Explore course" : "By invitation"}
              <Icon name="ArrowUpRight" size={15} />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
function Home({ user }: { user: Row }) {
  const { data: cs, error, reload } = useData("/catalog/courses");
  const learning = useData("/me/learning");
  const [dismiss, setDismiss] = useState(
    localStorage.getItem(cacheKey("compass-dismiss")) === "yes",
  );
  const joined = cs?.filter((c: Row) => c.joined) || [];
  const current = joined.find((c: Row) => c.progress < 100) || joined[0];
  const notes = learning.data?.notes?.length || 0;
  return (
    <>
      <div className="learner-greeting">
        <div>
          <span className="eyebrow">A FRESH PAGE. A LITTLE POSSIBILITY.</span>
          <h1>
            Hello, {user.name.split(" ")[0]}
            <span className="greeting-sun">
              <Icon name="Sun" size={29} />
            </span>
          </h1>
          <p>It’s a good day to grow into something new.</p>
        </div>
        <Link className="goal-chip" to="/progress">
          <Icon name="Flame" size={18} />
          <span>
            <strong>
              {learning.data?.progress?.filter((p: Row) => p.completed)
                .length || 0}
            </strong>{" "}
            little steps taken
          </span>
        </Link>
      </div>
      <div className="learner-home-grid">
        <div className="home-primary">
          <section className="learner-hero">
            <div>
              <span className="eyebrow">SMALL STEPS. BIG POSSIBILITIES.</span>
              <h2>
                Make room for
                <br />
                your next big idea.
              </h2>
              <p>
                A new perspective is only a lesson away.
                <br />
                Let your curiosity lead the way.
              </p>
              <Link
                to={current ? "/course/" + current.id : "/explore"}
                className="btn primary"
              >
                {current
                  ? "Pick up where you left off"
                  : "Find your next course"}
                <Icon name="ArrowUpRight" size={17} />
              </Link>
              <span className="hero-footnote">
                YOUR NEXT CHAPTER STARTS HERE.
              </span>
            </div>
            <div className="learner-hero-art">
              <Art color="sage" />
              <span className="hero-sticker">
                <Icon name="Sprout" size={16} />
                Keep on growing.
              </span>
              <div className="hero-orbit-label">CURIOUS BY NATURE.</div>
            </div>
          </section>
          <div className="learner-section-heading">
            <div>
              <h2>Your journey, continued.</h2>
              <p>A little momentum goes a long way.</p>
            </div>
            <Link to="/learning" className="text-link">
              My learning
              <Icon name="ArrowRight" size={15} />
            </Link>
          </div>
          {error ? (
            <ErrorState error={error} retry={reload} />
          ) : !cs ? (
            <Loading />
          ) : joined.length ? (
            <div className="continue-grid">
              {joined.slice(0, 2).map((c: Row, i: number) => (
                <CourseCard key={c.id} course={c} index={i} />
              ))}
            </div>
          ) : (
            <Empty
              title="A fresh start, just for you"
              text="Discover your first course and begin a new chapter."
              action={
                <Link to="/explore" className="btn primary">
                  Find your first course
                </Link>
              }
            />
          )}
          <div className="learner-section-heading">
            <div>
              <h2>For your curious side.</h2>
              <p>A few possibilities we think you’ll love.</p>
            </div>
            <Link to="/explore" className="text-link">
              Explore all
              <Icon name="ArrowRight" size={15} />
            </Link>
          </div>
          <div className="recommended-grid">
            {cs
              ?.filter((c: Row) => !c.joined)
              .slice(0, 2)
              .map((c: Row, i: number) => (
                <CourseCard key={c.id} course={c} index={i + 2} />
              ))}
          </div>
          <div className="learning-quote">
            <Icon name="Quote" size={24} />
            <p>
              “The beautiful thing about learning is that nobody can take it
              away from you.”
            </p>
            <span>B. B. KING</span>
          </div>
        </div>
        <aside className="home-aside">
          <section className="weekly-card">
            <div className="aside-card-heading">
              <Icon name="Sprout" size={18} />
              <h3>A little progress.</h3>
              <Link to="/progress" aria-label="View progress">
                <Icon name="ArrowUpRight" size={16} />
              </Link>
            </div>
            <div className="goal-ring">
              <svg viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r="59"
                  fill="none"
                  stroke="#e6eadb"
                  strokeWidth="8"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="59"
                  fill="none"
                  stroke="#77955d"
                  strokeWidth="8"
                  strokeDasharray={`${Math.min(1, ((learning.data?.progress?.filter((p: Row) => p.completed).length || 0) * 10) / (user.preferences?.weeklyGoal || 120)) * 371} 371`}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
              </svg>
              <div>
                <strong>
                  {(learning.data?.progress?.filter((p: Row) => p.completed)
                    .length || 0) * 10}
                  <span> / {user.preferences?.weeklyGoal || 120}</span>
                </strong>
                <small>estimated minutes</small>
              </div>
            </div>
            <p>
              Progress at your own pace.
              <br />
              Every small step counts.
            </p>
            <div className="week-days">
              {"MTWTFSS".split("").map((d, i) => (
                <span
                  key={i}
                  className={
                    i <
                    (learning.data?.progress?.filter((p: Row) => p.completed)
                      .length || 0)
                      ? "done"
                      : ""
                  }
                >
                  {i <
                  (learning.data?.progress?.filter((p: Row) => p.completed)
                    .length || 0) ? (
                    <Icon name="Check" size={11} />
                  ) : (
                    d
                  )}
                </span>
              ))}
            </div>
            <small className="estimate-note">
              Illustrative goal view · 10 min per completed lesson
            </small>
          </section>
          {!dismiss && (
            <section className="compass-card">
              <div className="aside-card-heading">
                <Icon name="Compass" size={19} />
                <h3>Your learning compass</h3>
                <button
                  className="icon-btn"
                  aria-label="Dismiss recommendation"
                  onClick={() => {
                    setDismiss(true);
                    localStorage.setItem(cacheKey("compass-dismiss"), "yes");
                  }}
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
              <span className="compass-tag">A THOUGHTFUL NEXT STEP</span>
              <h4>
                Turn a little insight
                <br />
                into a big possibility.
              </h4>
              <p>
                Continue design thinking to build on your first steps in
                human-centred problem solving.
              </p>
              <span className="compass-time">
                <Icon name="Clock3" size={13} />
                12 minutes · Optional
              </span>
              <Link to={current ? "/course/" + current.id : "/explore"}>
                Follow your curiosity
                <Icon name="ArrowUpRight" size={15} />
              </Link>
              <span className="compass-reason">
                <Icon name="Info" size={11} />
                Suggested from your enrolled courses
              </span>
            </section>
          )}
          <section className="up-next">
            <div className="aside-card-heading">
              <Icon name="CalendarDays" size={18} />
              <h3>On the horizon</h3>
            </div>
            <Link to="/assignments" className="up-next-row">
              <span className="calendar-tile">
                <small>NOV</small>
                <strong>15</strong>
              </span>
              <div>
                <strong>Your first design challenge</strong>
                <small>Assignment · Design thinking</small>
              </div>
              <Icon name="ChevronRight" size={14} />
            </Link>
            <Link to="/live" className="up-next-row">
              <span className="calendar-tile peach">
                <small>OCT</small>
                <strong>28</strong>
              </span>
              <div>
                <strong>Design Circle</strong>
                <small>Live learning · 45 minutes</small>
              </div>
              <Icon name="ChevronRight" size={14} />
            </Link>
          </section>
          <Link to="/assistant" className="companion-mini">
            <Icon name="Sparkles" size={23} />
            <div>
              <strong>A little help with a big idea?</strong>
              <p>Your learning companion is here.</p>
            </div>
            <Icon name="ArrowUpRight" size={16} />
          </Link>
        </aside>
      </div>
    </>
  );
}
function Explore() {
  const { data, error, reload } = useData("/catalog/courses");
  const saved = useData("/me/learning");
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("Everything"),
    [level, setLevel] = useState("All levels"),
    [sort, setSort] = useState("Recommended"),
    [savedOnly, setSavedOnly] = useState(false);
  const rows =
    data
      ?.filter(
        (c: Row) =>
          (c.title + " " + c.description + " " + c.instructor)
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (category === "Everything" || c.category === category) &&
          (level === "All levels" || c.level === level) &&
          (!savedOnly ||
            saved.data?.saved.some((r: Row) => r.courseId === c.id)),
      )
      .sort((a: Row, b: Row) =>
        sort === "Highest rated"
          ? b.rating - a.rating
          : sort === "A–Z"
            ? a.title.localeCompare(b.title)
            : 0,
      ) || [];
  return (
    <>
      <PageHeading
        eyebrow="FOLLOW YOUR CURIOSITY"
        title="What will you discover next?"
        description="Fresh perspectives. Practical skills. A little possibility for every curious mind."
      />
      <div className="explore-banner">
        <Icon name="Orbit" size={48} />
        <div>
          <h2>A whole world of possibility.</h2>
          <p>
            Find something that sparks an idea, builds a skill, or simply makes
            you think.
          </p>
        </div>
        <span>KEEP EXPLORING.</span>
      </div>
      <div className="explore-toolbar">
        <label className="search-input">
          <Icon name="Search" size={18} />
          <input
            aria-label="Search catalogue"
            placeholder="What are you curious about?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          value={level}
          aria-label="Filter level"
          onChange={(e) => setLevel(e.target.value)}
        >
          <option>All levels</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
        <button
          className={"btn " + (savedOnly ? "primary" : "")}
          onClick={() => {
            setSavedOnly(!savedOnly);
            saved.reload();
          }}
        >
          <Icon name="Bookmark" size={15} />
          Saved
        </button>
      </div>
      <div className="category-chips">
        {[
          "Everything",
          "Design",
          "Business",
          "Data & Technology",
          "Personal growth",
        ].map((c, i) => (
          <button
            key={c}
            className={category === c ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            <Icon
              name={
                [
                  "Grid2X2",
                  "Shapes",
                  "BriefcaseBusiness",
                  "ChartNoAxesCombined",
                  "Sprout",
                ][i]
              }
              size={15}
            />
            {c}
          </button>
        ))}
      </div>
      <div className="results-label">
        <span>{rows.length} little possibilities</span>
        <label>
          Sort by{" "}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Recommended</option>
            <option>Highest rated</option>
            <option>A–Z</option>
          </select>
        </label>
      </div>
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data ? (
        <Loading />
      ) : rows.length ? (
        <div className="explore-grid">
          {rows.map((c: Row, i: number) => (
            <CourseCard key={c.id} course={c} index={i} />
          ))}
        </div>
      ) : (
        <Empty
          icon="Search"
          title="A different kind of curiosity?"
          text="Try another search or clear your filters to see more possibilities."
          action={
            <button
              className="btn"
              onClick={() => {
                setCategory("Everything");
                setLevel("All levels");
                setSearch("");
                setSavedOnly(false);
              }}
            >
              Clear filters
            </button>
          }
        />
      )}
    </>
  );
}
function MyLearning() {
  const { data, error, reload } = useData("/catalog/courses");
  const [tab, setTab] = useState("In progress");
  const rows =
    data?.filter(
      (c: Row) =>
        c.joined &&
        (tab === "All learning" || tab === "Completed"
          ? tab === "All learning" || c.progress === 100
          : c.progress < 100),
    ) || [];
  return (
    <>
      <PageHeading
        eyebrow="ONE SMALL STEP AT A TIME"
        title="Your journey, your pace."
        description="Pick up where you left off. You’re closer than you think."
      />
      <div className="metric-strip">
        {["In progress", "Completed", "All learning"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
            <span>
              {data?.filter(
                (c: Row) =>
                  c.joined &&
                  (t === "All learning" ||
                    (t === "Completed" && c.progress === 100) ||
                    (t === "In progress" && c.progress < 100)),
              ).length || 0}
            </span>
          </button>
        ))}
      </div>
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data ? (
        <Loading />
      ) : rows.length ? (
        <div className="explore-grid">
          {rows.map((c: Row, i: number) => (
            <CourseCard key={c.id} course={c} index={i} />
          ))}
        </div>
      ) : (
        <Empty
          icon="Sprout"
          title={
            tab === "Completed"
              ? "Good things take a little time."
              : "Your next chapter is waiting."
          }
          text="Every journey starts with a little curiosity. Find a course that feels right for you."
          action={
            <Link className="btn primary" to="/explore">
              Explore courses
              <Icon name="ArrowRight" size={16} />
            </Link>
          }
        />
      )}
    </>
  );
}
function Course() {
  const { id } = useParams();
  const { data: c, error, reload } = useData("/courses/" + id);
  const [tab, setTab] = useState("Your learning path"),
    [atlas, setAtlas] = useState(true),
    [busy, setBusy] = useState(false);
  const toast = useToast(),
    nav = useNavigate();
  if (error) return <ErrorState error={error} retry={reload} />;
  if (!c) return <Loading />;
  const next = c.lessons.find((l: Row) => !l.completed) || c.lessons[0],
    done = c.lessons.filter((l: Row) => l.completed).length;
  const join = async () => {
    setBusy(true);
    try {
      await post("/courses/" + id + "/enrolments");
      reload();
      toast("A new possibility, just for you. You’re enrolled.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Link className="back-link" to="/learning">
        <Icon name="ArrowLeft" size={15} />
        Back to your learning
      </Link>
      <div className="course-detail-hero">
        <div>
          <span className="course-detail-category">
            {c.category} <i>·</i>
            {c.level}
          </span>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
          <div className="course-detail-author">
            <Avatar name={c.instructor} />
            <span>
              Learn with <strong>{c.instructor}</strong>
            </span>
            <span>
              <Icon name="Star" size={13} />
              {c.rating} <small>pilot rating</small>
            </span>
          </div>
          <div className="course-detail-facts">
            <span>
              <Icon name="Clock3" size={15} />
              {c.duration}
            </span>
            <span>
              <Icon name="Layers" size={15} />
              {c.lessons.length} lessons
            </span>
            <span>
              <Icon name="Globe2" size={15} />
              {c.language}
            </span>
          </div>
          {c.joined ? (
            <button
              className="btn primary"
              onClick={() => next && nav("/lesson/" + next.id)}
              disabled={!next}
            >
              {done ? "Continue your journey" : "Start learning"}
              <Icon name="ArrowRight" size={17} />
            </button>
          ) : c.access === "Open" ? (
            <button className="btn primary" onClick={join} disabled={busy}>
              Begin your journey · Free
              <Icon name="ArrowUpRight" size={17} />
            </button>
          ) : (
            <Link className="btn" to="/support">
              <Icon name="LockKeyhole" size={16} />
              Request organisation access
            </Link>
          )}
        </div>
        <Art color={c.color} />
      </div>
      <div className="course-detail-layout">
        <div>
          <div className="editor-tabs standalone">
            {["Your learning path", "About the course", "Resources"].map(
              (t) => (
                <button
                  key={t}
                  className={tab === t ? "active" : ""}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          {tab === "Your learning path" ? (
            <>
              <div className="atlas-header">
                <div>
                  <h2>A little map. A clear direction.</h2>
                  <p>
                    {done} of {c.lessons.length} lessons complete
                  </p>
                </div>
                <button className="btn" onClick={() => setAtlas(!atlas)}>
                  <Icon name={atlas ? "List" : "Route"} size={15} />
                  {atlas ? "List view" : "Atlas view"}
                </button>
              </div>
              <div className={"course-atlas " + (atlas ? "visual" : "")}>
                {c.lessons.map((l: Row, i: number) => (
                  <React.Fragment key={l.id}>
                    {(i === 0 || c.lessons[i - 1]?.module !== l.module) && (
                      <h3 className="atlas-module">{l.module}</h3>
                    )}
                    <button
                      className={
                        "atlas-lesson " +
                        (l.completed ? "complete" : "") +
                        (next?.id === l.id ? " current" : "")
                      }
                      onClick={() =>
                        c.joined
                          ? nav("/lesson/" + l.id)
                          : toast(
                              "Enrol in this course to unlock your learning path.",
                              "error",
                            )
                      }
                    >
                      <span className="atlas-dot">
                        {l.completed ? (
                          <Icon name="Check" size={17} />
                        ) : !c.joined ? (
                          <Icon name="LockKeyhole" size={14} />
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </span>
                      <div>
                        <strong>{l.title}</strong>
                        <span>
                          <Icon
                            name={
                              l.type === "Audio" ? "Headphones" : "FileText"
                            }
                            size={12}
                          />
                          {l.type} · {l.duration} min
                          {l.completed && " · Complete"}
                        </span>
                      </div>
                      {next?.id === l.id && c.joined ? (
                        <span className="next-label">YOUR NEXT STEP</span>
                      ) : (
                        <Icon name="ChevronRight" size={16} />
                      )}
                    </button>
                  </React.Fragment>
                ))}
                <div className="atlas-checkpoint">
                  <span className="atlas-dot">
                    <Icon name="CircleHelp" size={19} />
                  </span>
                  <div>
                    <h3>A moment to reflect.</h3>
                    <p>5 questions · 15 min · Pass mark 80% · 3 attempts</p>
                  </div>
                  <Link
                    className="btn"
                    to={c.joined ? "/quiz/" + c.id : "/course/" + c.id}
                  >
                    Take the assessment
                    <Icon name="ArrowRight" size={15} />
                  </Link>
                </div>
              </div>
            </>
          ) : tab === "About the course" ? (
            <section className="panel about-course">
              <h2>What you’ll take with you.</h2>
              {c.outcomes.split(";").map((o: string) => (
                <p key={o}>
                  <Icon name="CircleCheck" size={18} />
                  {o.trim()}
                </p>
              ))}
              <h3>A little preparation.</h3>
              <p>
                Bring a curious mind, a notebook, and a willingness to try
                something new. This prototype includes an illustrative
                human-centred learning curriculum.
              </p>
              <h3>How completion works.</h3>
              <p>
                Complete all required lessons and score at least 80% in the
                final assessment. Completion and demonstrated assessment
                performance are measured separately.
              </p>
            </section>
          ) : (
            <div className="panel about-course">
              <h2>Make a little space to practise.</h2>
              <p>
                Use a notebook or notes in the lesson player to record your
                observations, questions, and ideas.
              </p>
              <button
                className="btn"
                onClick={() =>
                  download(
                    "qubit-reflection-workbook.txt",
                    "MY LEARNING REFLECTION\n\n1. What surprised me?\n\n2. What evidence did I notice?\n\n3. What assumption will I test?\n\n4. My next small step\n",
                    "text/plain",
                  )
                }
              >
                <Icon name="Download" size={16} />
                Download reflection workbook
              </button>
            </div>
          )}
        </div>
        <aside className="course-side-note">
          <Icon name="Compass" size={27} />
          <h3>
            You don’t need to
            <br />
            have it all figured out.
          </h3>
          <p>
            Just take the next small step. Your progress is saved as you go.
          </p>
          <div className="progress-label">
            <span>Your course progress</span>
            <strong>{Math.round((done / c.lessons.length) * 100) || 0}%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: (done / c.lessons.length) * 100 + "%" }} />
          </div>
          <Link className="text-link" to="/assistant">
            Ask your learning companion
            <Icon name="ArrowUpRight" size={15} />
          </Link>
        </aside>
      </div>
    </>
  );
}
function Lesson() {
  const { id } = useParams(),
    nav = useNavigate(),
    toast = useToast();
  const { data: l, error, reload } = useData("/lessons/" + id);
  const [cached, setCached] = useState<Row | null>(null),
    [tab, setTab] = useState("Lesson"),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [focus, setFocus] = useState(false),
    [speed, setSpeed] = useState("1"),
    [speaking, setSpeaking] = useState(false);
  const c = useData(
    l?.courseId || cached?.courseId
      ? "/courses/" + (l?.courseId || cached?.courseId)
      : "",
  );
  const learning = useData("/me/learning", id);
  useEffect(() => {
    const d = downloads().find((d) => d.id === id && d.expires > Date.now());
    setCached(d || null);
    setText("");
    setTab("Lesson");
  }, [id]);
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [id],
  );
  const lesson = l || cached;
  const completed = learning.data?.progress?.some(
    (p: Row) => p.lesson_id === id && p.completed,
  );
  if (!lesson && error) return <ErrorState error={error} retry={reload} />;
  if (!lesson) return <Loading />;
  const next = c.data?.lessons?.find(
    (r: Row) => r.position === lesson.position + 1,
  );
  const complete = async () => {
    setBusy(true);
    try {
      const r = await progress(lesson.id, true);
      toast(
        r.queued
          ? "Progress saved on this device. It will sync when you reconnect."
          : "A little progress, beautifully made.",
      );
      learning.reload();
      if (
        next &&
        (navigator.onLine ||
          downloads().some((d) => d.id === next.id && d.expires > Date.now()))
      )
        nav("/lesson/" + next.id);
      else if (!next) nav("/course/" + lesson.courseId);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  const speak = () => {
    if (!("speechSynthesis" in window)) {
      toast(
        "Read-aloud isn’t available on this device. The full transcript is below.",
        "error",
      );
      return;
    }
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(lesson.content);
    utter.rate = Number(speed);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    speechSynthesis.speak(utter);
    setSpeaking(true);
  };
  return (
    <div className={"lesson-page " + (focus ? "focus-mode" : "")}>
      <div className="lesson-topline">
        <Link className="back-link" to={"/course/" + lesson.courseId}>
          <Icon name="ArrowLeft" size={16} />
          Back to course
        </Link>
        <button className="btn" onClick={() => setFocus(!focus)}>
          <Icon name={focus ? "Minimize2" : "Maximize2"} size={15} />
          {focus ? "Leave focus mode" : "Focus mode"}
        </button>
      </div>
      <div className="lesson-layout">
        <article className="lesson-article">
          <span className="eyebrow">
            {lesson.module} <span>·</span> {lesson.duration} MINUTE READ
          </span>
          <h1>{lesson.title}</h1>
          <p className="lesson-subtitle">{lesson.subtitle}</p>
          <div className="lesson-tools">
            <button onClick={speak}>
              <Icon name={speaking ? "Pause" : "Headphones"} size={16} />
              {speaking ? "Pause read-aloud" : "Listen to this lesson"}
            </button>
            <select
              aria-label="Reading speed"
              value={speed}
              onChange={(e) => {
                setSpeed(e.target.value);
                speechSynthesis?.cancel();
                setSpeaking(false);
              }}
            >
              {["0.75", "1", "1.25", "1.5", "2"].map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
            <button
              onClick={async () => {
                try {
                  await api("/me/bookmarks/" + lesson.id, {
                    method: "PUT",
                    body: JSON.stringify({
                      lessonId: lesson.id,
                      title: lesson.title,
                    }),
                  });
                  toast("A good idea, bookmarked.");
                  learning.reload();
                } catch (e) {
                  toast((e as Error).message, "error");
                }
              }}
              aria-label="Bookmark lesson"
            >
              <Icon name="Bookmark" size={17} />
            </button>
            <button
              aria-label="Download lesson"
              onClick={async () => {
                try {
                  saveDownload(await api("/lessons/" + lesson.id + "/offline"));
                  toast("Saved for offline learning for 24 hours.");
                } catch (e) {
                  toast(
                    (e as Error).message ||
                      "Storage is full. Remove a download and try again.",
                    "error",
                  );
                }
              }}
            >
              <Icon name="Download" size={17} />
            </button>
          </div>
          <div className="lesson-cover">
            <Art color="sage" variant={lesson.position} />
            <span className="lesson-cover-caption">
              A LITTLE PERSPECTIVE CHANGES EVERYTHING.
            </span>
          </div>
          <div className="lesson-reading-tabs">
            <button
              className={tab === "Lesson" ? "active" : ""}
              onClick={() => setTab("Lesson")}
            >
              Lesson
            </button>
            <button
              className={tab === "Transcript" ? "active" : ""}
              onClick={() => setTab("Transcript")}
            >
              Transcript
            </button>
            <span>
              <Icon name="Volume2" size={12} />
              Device read-aloud · not a recording
            </span>
          </div>
          <div className="lesson-prose">
            {lesson.content.split("\n\n").map((p: string, i: number) => (
              <p
                className={
                  i === lesson.content.split("\n\n").length - 1
                    ? "reflection-prompt"
                    : ""
                }
                key={i}
              >
                {i === lesson.content.split("\n\n").length - 1 && (
                  <Icon name="Lightbulb" size={22} />
                )}
                <span>{p}</span>
              </p>
            ))}
          </div>
          <div className="lesson-next">
            <div>
              <span className="eyebrow">ONE SMALL STEP FORWARD.</span>
              <h3>
                {completed
                  ? "Make room to revisit a good idea."
                  : "Ready for your next little possibility?"}
              </h3>
              <p>
                {next
                  ? `Up next: ${next.title}`
                  : "Next: a moment to reflect and practise."}
              </p>
            </div>
            <button className="btn primary" disabled={busy} onClick={complete}>
              {busy ? "Saving…" : "Complete & continue"}
              <Icon name="ArrowRight" size={16} />
            </button>
          </div>
          <Link className="report-link" to="/support">
            <Icon name="Flag" size={12} />
            Something unclear? Report a content issue.
          </Link>
        </article>
        <aside className="lesson-notes">
          <div className="notes-header">
            <Icon name="NotebookPen" size={20} />
            <h3>A space for your thoughts.</h3>
          </div>
          <p>Good ideas don’t always arrive in order. Make a note of yours.</p>
          <label className="sr-only" htmlFor="lesson-note">
            Your lesson note
          </label>
          <textarea
            id="lesson-note"
            rows={6}
            placeholder="An idea, a question, a little spark…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="btn primary"
            disabled={!text.trim()}
            onClick={async () => {
              try {
                const r = await note(lesson.id, text);
                setText("");
                learning.reload();
                toast(
                  r.queued
                    ? "Note saved on this device. Sync pending."
                    : "Your thought, safely saved.",
                );
              } catch (e) {
                toast((e as Error).message, "error");
              }
            }}
          >
            Save a little thought
            <Icon name="Plus" size={15} />
          </button>
          <div className="saved-notes">
            {learning.data?.notes
              ?.filter((n: Row) => n.lessonId === id)
              .map((n: Row) => (
                <div key={n.id}>
                  <small>YOUR NOTE</small>
                  <p>{n.text}</p>
                  <button
                    aria-label="Delete note"
                    onClick={async () => {
                      await api("/me/notes/" + n.id, { method: "DELETE" });
                      learning.reload();
                    }}
                  >
                    <Icon name="Trash2" size={13} />
                  </button>
                </div>
              ))}
          </div>
          <div className="note-companion">
            <Icon name="Sparkles" size={24} />
            <h4>A different way to see it?</h4>
            <p>Your companion can help you revisit the key ideas.</p>
            <Link to={"/assistant?lesson=" + lesson.id}>
              Open learning companion
              <Icon name="ArrowUpRight" size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
function Quiz() {
  const { id } = useParams(),
    toast = useToast();
  const { data: c, error, reload } = useData("/courses/" + id);
  const learning = useData("/me/learning");
  const [attempt, setAttempt] = useState<Row | null>(null),
    [answers, setAnswers] = useState<Row>({}),
    [index, setIndex] = useState(0),
    [result, setResult] = useState<Row | null>(null),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState(""),
    [remaining, setRemaining] = useState(900),
    [review, setReview] = useState(false);
  useEffect(() => {
    if (!attempt || result) return;
    const update = () =>
      setRemaining(
        Math.max(0, Math.floor((attempt.expires - Date.now()) / 1000)),
      );
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [attempt?.id, result]);
  useEffect(() => {
    if (!attempt || result) return;
    const t = setTimeout(
      () =>
        api("/quiz-attempts/" + attempt.id + "/responses", {
          method: "PUT",
          body: JSON.stringify(answers),
        }).catch((e) => setErr(e.message)),
      500,
    );
    return () => clearTimeout(t);
  }, [answers, attempt?.id]);
  const start = async () => {
    setBusy(true);
    setErr("");
    try {
      const a = await post("/quizzes/" + id + "/attempts");
      setAttempt(a);
      setAnswers(a.responses);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await api("/quiz-attempts/" + attempt!.id + "/responses", {
        method: "PUT",
        body: JSON.stringify(answers),
      });
      setResult(await post("/quiz-attempts/" + attempt!.id + "/submit"));
      learning.reload();
      toast("Your reflection is complete. Here’s how you did.");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (error) return <ErrorState error={error} retry={reload} />;
  if (!c) return <Loading />;
  if (!c.joined) return <Navigate to={"/course/" + id} />;
  const q = attempt?.questions[index];
  return (
    <div className="quiz-page">
      <Link className="back-link" to={"/course/" + id}>
        <Icon name="ArrowLeft" size={15} />
        Back to your course
      </Link>
      {!attempt ? (
        <div className="quiz-intro">
          <span className="quiz-intro-icon">
            <Icon name="Sprout" size={38} />
          </span>
          <span className="eyebrow">A MOMENT TO REFLECT</span>
          <h1>See how far you’ve come.</h1>
          <p>
            This isn’t about perfection. It’s a chance to connect the ideas
            <br />
            you’ve explored and see what’s taking shape.
          </p>
          <h3>{c.title}</h3>
          <div className="quiz-facts">
            {[
              ["CircleHelp", "5", "questions"],
              ["Clock3", "15", "minutes"],
              ["Target", "80%", "pass mark"],
              ["RotateCcw", "3", "attempts"],
            ].map(([icon, n, label]) => (
              <div key={label}>
                <Icon name={icon} size={20} />
                <strong>{n}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="notice">
            <Icon name="Info" />
            Your answers are saved while online. The timer begins when you
            start. Grading happens on the server; answer explanations appear
            after submission.
          </div>
          <button
            className="btn primary"
            disabled={busy || !navigator.onLine}
            onClick={start}
          >
            {busy
              ? "Preparing your questions…"
              : "Let’s give it a little thought"}
            <Icon name="ArrowRight" size={17} />
          </button>
          {err && <p className="form-error">{err}</p>}
          <div className="attempt-history">
            {learning.data?.attempts
              .filter((a: Row) => a.course_id === id)
              .map((a: Row) => (
                <div key={a.id}>
                  <span>{new Date(a.started).toLocaleDateString()}</span>
                  <Badge>{a.status}</Badge>
                  <strong>{a.score !== null ? a.score + "%" : "—"}</strong>
                </div>
              ))}
          </div>
        </div>
      ) : result ? (
        <div className="quiz-result">
          <div className="result-emblem">
            <Icon name={result.passed ? "Award" : "Sprout"} size={45} />
          </div>
          <span className="eyebrow">EVERY ATTEMPT IS A STEP FORWARD</span>
          <h1>
            {result.passed
              ? "Look at you grow."
              : "A little more practice. A new possibility."}
          </h1>
          <p>
            {result.passed
              ? "You connected the ideas beautifully. Keep that curiosity going."
              : "You’re building understanding. Revisit the references below and try again when you’re ready."}
          </p>
          <strong className="result-score">
            {result.score}
            <small>%</small>
          </strong>
          <Badge>{result.passed ? "Passed" : "Keep practising"}</Badge>
          <div className="result-review">
            {result.review?.map((r: Row, i: number) => (
              <div key={r.id}>
                <span>
                  <Icon
                    name={r.correct ? "CircleCheck" : "CircleAlert"}
                    size={19}
                  />
                  <strong>
                    {i + 1}. {r.prompt}
                  </strong>
                </span>
                <p>{r.explanation}</p>
                <small>Source: {r.reference}</small>
              </div>
            ))}
          </div>
          <div className="button-row">
            <Link className="btn primary" to={"/course/" + id}>
              Back to your learning
              <Icon name="ArrowRight" size={16} />
            </Link>
            {result.passed && (
              <Link className="btn" to="/certificates">
                <Icon name="Award" size={16} />
                Your achievements
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="quiz-header">
            <div>
              <span className="eyebrow">A LITTLE CHECK-IN</span>
              <h2>{c.title}</h2>
            </div>
            <span className={"quiz-timer " + (remaining < 120 ? "urgent" : "")}>
              <Icon name="Clock3" size={17} />
              {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="quiz-progress">
            <span
              style={{
                width:
                  (100 * Object.keys(answers).length) /
                    attempt.questions.length +
                  "%",
              }}
            />
          </div>
          {remaining === 0 && (
            <div className="form-error">
              This assessment’s time limit has passed. Your previous responses
              are saved, but submission is closed.
            </div>
          )}
          {err && <p className="form-error">{err}</p>}
          {review ? (
            <div className="quiz-question">
              <span className="eyebrow">ONE LAST LOOK</span>
              <h1>Ready to connect the dots?</h1>
              <p>
                {Object.keys(answers).length} of {attempt.questions.length}{" "}
                questions answered. You can revisit any question before
                submitting.
              </p>
              <div className="quiz-review-list">
                {attempt.questions.map((r: Row, i: number) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setIndex(i);
                      setReview(false);
                    }}
                  >
                    <span>{i + 1}</span>
                    <strong>{r.prompt}</strong>
                    <Badge>
                      {answers[r.id] !== undefined
                        ? "Answered"
                        : "Not answered"}
                    </Badge>
                    <Icon name="ChevronRight" size={16} />
                  </button>
                ))}
              </div>
              <button
                className="btn primary"
                disabled={busy || remaining === 0}
                onClick={submit}
              >
                {busy ? "Submitting…" : "Submit your assessment"}
                <Icon name="Check" size={16} />
              </button>
            </div>
          ) : (
            <div className="quiz-question">
              <span className="eyebrow">
                QUESTION {index + 1} OF {attempt.questions.length}{" "}
                <span>·</span>{" "}
                {q.type === "multiple"
                  ? "SELECT ALL THAT APPLY"
                  : q.type === "text"
                    ? "A SHORT RESPONSE"
                    : "CHOOSE ONE ANSWER"}
              </span>
              <h1>{q.prompt}</h1>
              {q.type === "text" ? (
                <label className="standalone-label">
                  Your answer
                  <input
                    placeholder="A little thought goes here…"
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [q.id]: e.target.value })
                    }
                  />
                </label>
              ) : (
                <div className="answer-options">
                  {q.options.map((o: string, i: number) => {
                    const checked = Array.isArray(answers[q.id])
                      ? answers[q.id].includes(i)
                      : answers[q.id] === i;
                    return (
                      <label key={o} className={checked ? "selected" : ""}>
                        <input
                          type={q.type === "multiple" ? "checkbox" : "radio"}
                          name={q.id}
                          checked={checked}
                          onChange={() =>
                            setAnswers({
                              ...answers,
                              [q.id]:
                                q.type === "multiple"
                                  ? checked
                                    ? (answers[q.id] || []).filter(
                                        (n: number) => n !== i,
                                      )
                                    : [...(answers[q.id] || []), i]
                                  : i,
                            })
                          }
                        />
                        <span>{String.fromCharCode(65 + i)}</span>
                        <strong>{o}</strong>
                        <Icon
                          name={checked ? "CircleCheck" : "Circle"}
                          size={19}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
              <div className="quiz-navigation">
                <button
                  className="btn"
                  disabled={index === 0}
                  onClick={() => setIndex((i) => i - 1)}
                >
                  <Icon name="ArrowLeft" size={15} />
                  Previous
                </button>
                <small>Saved automatically while online</small>
                <button
                  className="btn primary"
                  onClick={() =>
                    index + 1 < attempt.questions.length
                      ? setIndex((i) => i + 1)
                      : setReview(true)
                  }
                >
                  {index + 1 === attempt.questions.length
                    ? "Review answers"
                    : "Next question"}
                  <Icon name="ArrowRight" size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
function Assignments() {
  const { data, error, reload } = useData("/learning/resources/assignments");
  const learning = useData("/me/learning");
  const [selected, setSelected] = useState<Row | null>(null),
    [text, setText] = useState(""),
    [attachment, setAttachment] = useState<Row | null>(null),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false);
  const toast = useToast();
  return (
    <>
      <PageHeading
        eyebrow="PUT A LITTLE POSSIBILITY INTO PRACTICE"
        title="Ideas become real when you try."
        description="A space to explore, apply, and get thoughtful feedback."
      />
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data ? (
        <Loading />
      ) : (
        <div className="assignment-list">
          {data.map((a: Row) => {
            const s = learning.data?.submissions.find(
              (s: Row) => s.assignmentId === a.id,
            );
            return (
              <button
                key={a.id}
                className="panel assignment-card"
                onClick={() => {
                  setSelected(a);
                  setText(
                    localStorage.getItem(cacheKey("draft:" + a.id)) || "",
                  );
                  setAttachment(null);
                }}
              >
                <span className="assignment-icon">
                  <Icon name="NotebookPen" size={27} />
                </span>
                <div>
                  <span className="eyebrow">
                    {a.courseId.replaceAll("-", " ")}
                  </span>
                  <h2>{a.title}</h2>
                  <p>
                    Due{" "}
                    {new Date(a.due).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    · Reviewed by {a.reviewer}
                  </p>
                </div>
                <Badge>{s?.status || "Ready to begin"}</Badge>
                <Icon name="ArrowUpRight" size={20} />
              </button>
            );
          })}
          {data.length === 0 && (
            <Empty
              icon="NotebookPen"
              title="A little space for your next challenge"
              text="Your assigned work will appear here."
            />
          )}
        </div>
      )}
      {selected && (
        <Modal
          wide
          title={selected.title}
          subtitle={"Due " + new Date(selected.due).toLocaleDateString()}
          onClose={() => setSelected(null)}
        >
          <div className="editor-content">
            <div className="assignment-instructions">
              {selected.description}
            </div>
            {(() => {
              const s = learning.data?.submissions.find(
                (s: Row) => s.assignmentId === selected.id,
              );
              return s && s.status !== "Returned" ? (
                <>
                  <div className="notice">
                    <Icon name="CircleCheck" />
                    <div>
                      <strong>Your work is {s.status.toLowerCase()}.</strong>
                      <p>{new Date(s.submitted).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="submitted-text">{s.text}</p>
                  {s.feedback && (
                    <div className="feedback-card">
                      <h3>A little feedback to grow with.</h3>
                      <strong>{s.grade}/100</strong>
                      <p>{s.feedback}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label className="standalone-label">
                    Your reflection
                    <textarea
                      rows={8}
                      placeholder="What did you notice? What might you try?"
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        localStorage.setItem(
                          cacheKey("draft:" + selected.id),
                          e.target.value,
                        );
                      }}
                    />
                  </label>
                  <div className="assignment-upload">
                    <label className="btn file-button">
                      <Icon name="Paperclip" size={16} />
                      {uploading
                        ? "Uploading…"
                        : "Attach a PDF, image, or text file"}
                      <input
                        type="file"
                        accept=".pdf,.txt,.png,.jpg,.jpeg"
                        disabled={uploading || !navigator.onLine}
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (f.size > 5 * 1024 * 1024) {
                            toast("Choose a file up to 5 MB.", "error");
                            return;
                          }
                          setUploading(true);
                          try {
                            const data = await new Promise<string>(
                              (resolve, reject) => {
                                const r = new FileReader();
                                r.onload = () =>
                                  resolve(String(r.result).split(",")[1]);
                                r.onerror = reject;
                                r.readAsDataURL(f);
                              },
                            );
                            setAttachment(
                              await post("/uploads", {
                                name: f.name,
                                type: f.type,
                                data,
                              }),
                            );
                            toast("Attachment ready.");
                          } catch (e) {
                            toast((e as Error).message, "error");
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                    </label>
                    {attachment && (
                      <span className="badge good">{attachment.name}</span>
                    )}
                    <small>5 MB maximum · text response required</small>
                  </div>
                  <div className="notice">
                    <Icon name="Info" />
                    Drafts save on this device. Submission requires a
                    connection. The prototype accepts late submissions for
                    reviewer consideration.
                  </div>
                  <button
                    className="btn primary"
                    disabled={
                      busy ||
                      uploading ||
                      text.trim().length < 30 ||
                      !navigator.onLine
                    }
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await post("/assignments/" + selected.id + "/submit", {
                          text,
                          ...(attachment
                            ? { attachmentId: attachment.id }
                            : {}),
                        });
                        localStorage.removeItem(
                          cacheKey("draft:" + selected.id),
                        );
                        learning.reload();
                        setSelected(null);
                        toast(
                          "Your work is in. A little feedback is on its way.",
                        );
                      } catch (e) {
                        toast((e as Error).message, "error");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Submit your work
                    <Icon name="Send" size={16} />
                  </button>
                </>
              );
            })()}
          </div>
        </Modal>
      )}
    </>
  );
}
function Progress({ user }: { user: Row }) {
  const { data: l, error, reload } = useData("/me/learning");
  const cs = useData("/catalog/courses");
  const toast = useToast();
  if (error) return <ErrorState error={error} retry={reload} />;
  if (!l) return <Loading />;
  const completed = l.progress.filter((p: Row) => p.completed).length;
  const scores = l.attempts.filter((a: Row) => a.status === "Submitted");
  const average = scores.length
    ? Math.round(
        scores.reduce((s: number, a: Row) => s + a.score, 0) / scores.length,
      )
    : null;
  return (
    <>
      <PageHeading
        eyebrow="LOOK HOW FAR YOU’VE COME"
        title="A little progress. A lot of possibility."
        description="Your learning story, one meaningful step at a time."
        actions={
          <button
            className="btn"
            onClick={async () => {
              try {
                download(
                  "my-qubit-learning.json",
                  JSON.stringify(await api("/me/export"), null, 2),
                );
                toast("Your learning records are ready.");
              } catch (e) {
                toast((e as Error).message, "error");
              }
            }}
          >
            <Icon name="Download" size={16} />
            Export my progress
          </button>
        }
      />
      <div className="progress-stats">
        {[
          [
            "BookOpenCheck",
            completed,
            "Lessons completed",
            "Small steps, acknowledged.",
          ],
          [
            "Target",
            average === null ? "—" : average + "%",
            "Assessment average",
            "Submitted assessments only.",
          ],
          [
            "NotebookPen",
            l.notes.length,
            "Thoughts captured",
            "A little space for your ideas.",
          ],
          [
            "Award",
            l.certificates.length,
            "Certificates earned",
            "Evidence-backed achievement.",
          ],
        ].map(([icon, n, label, note]) => (
          <div className="panel progress-stat" key={String(label)}>
            <Icon name={String(icon)} size={22} />
            <strong>{n}</strong>
            <span>{label}</span>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="mastery-panel panel">
        <div>
          <span className="eyebrow">YOUR MASTERY LENS</span>
          <h2>
            Different kinds of progress.
            <br />
            Each worth noticing.
          </h2>
          <p>
            Completion shows the steps you’ve taken. Assessments offer a moment
            to demonstrate understanding. Neither tells your whole story.
          </p>
        </div>
        <div className="mastery-metrics">
          {[
            [
              "Completion",
              completed
                ? Math.round(
                    (completed /
                      (cs.data
                        ?.filter((c: Row) => c.joined)
                        .reduce((n: number, c: Row) => n + c.total, 0) || 1)) *
                      100,
                  )
                : 0,
              "Completed required lessons",
            ],
            [
              "Assessment",
              average || 0,
              scores.length
                ? "Average submitted score"
                : "No assessment evidence yet",
            ],
            [
              "Reflection",
              Math.min(l.notes.length * 10, 100),
              "Illustrative practice indicator",
            ],
          ].map(([s, n, t]) => (
            <div key={s}>
              <span>
                {s}
                <strong>{n}%</strong>
              </span>
              <div className="progress-track">
                <span style={{ width: n + "%" }} />
              </div>
              <small>{t}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="learner-section-heading">
        <div>
          <h2>Your growing collection of skills.</h2>
          <p>
            Progress from your enrolled courses. These are course completion
            measures.
          </p>
        </div>
        <Link to="/learning" className="text-link">
          Keep growing
          <Icon name="ArrowRight" size={16} />
        </Link>
      </div>
      <div className="skill-grid">
        {cs.data
          ?.filter((c: Row) => c.joined)
          .map((c: Row, i: number) => (
            <Link
              className="panel skill-card"
              to={"/course/" + c.id}
              key={c.id}
            >
              <span
                className={"skill-icon " + ["green", "peach", "purple"][i % 3]}
              >
                <Icon
                  name={
                    ["Shapes", "BriefcaseBusiness", "ChartNoAxesCombined"][
                      i % 3
                    ]
                  }
                  size={23}
                />
              </span>
              <h3>{c.title}</h3>
              <div className="progress-label">
                <span>
                  {c.completed} of {c.total} lessons
                </span>
                <strong>{c.progress}%</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: c.progress + "%" }} />
              </div>
            </Link>
          ))}
      </div>
      <div className="panel learning-history">
        <div className="panel-heading">
          <div>
            <h2>Your recent little steps.</h2>
            <p>Actual completion, practice, and reflection activity.</p>
          </div>
        </div>
        {l.progress.length || scores.length ? (
          <>
            {[
              ...l.progress.map((p: Row) => ({
                title: p.lesson_id.replaceAll("-", " "),
                detail: p.completed ? "Lesson completed" : "Progress saved",
                time: p.updated,
                icon: "Check",
              })),
              ...scores.map((a: Row) => ({
                title: a.course_id.replaceAll("-", " "),
                detail: `Assessment submitted · ${a.score}%`,
                time: a.submitted,
                icon: "Target",
              })),
            ]
              .sort(
                (a, b) =>
                  new Date(b.time).getTime() - new Date(a.time).getTime(),
              )
              .slice(0, 12)
              .map((a, i) => (
                <div className="history-row" key={i}>
                  <span>
                    <Icon name={a.icon} size={17} />
                  </span>
                  <div>
                    <h3>{a.title}</h3>
                    <p>{a.detail}</p>
                  </div>
                  <small>
                    {new Date(a.time).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </small>
                </div>
              ))}
          </>
        ) : (
          <Empty
            title="Your story starts with a little step."
            text="Complete a lesson and watch your learning history grow."
          />
        )}
      </div>
    </>
  );
}
function Assistant() {
  const cs = useData("/catalog/courses");
  const [course, setCourse] = useState("design-thinking"),
    [lessonId, setLessonId] = useState(
      new URLSearchParams(location.search).get("lesson") ||
        "design-thinking-lesson-1",
    );
  const detail = useData("/courses/" + course);
  const [messages, setMessages] = useState<Row[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState("explain");
  const toast = useToast(),
    bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);
  const ask = async (question: string, selectedMode = mode) => {
    if (!question.trim() || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const r = await post("/tutor", {
        lessonId,
        question,
        mode: selectedMode,
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", text: r.answer, source: r.source, label: r.mode },
      ]);
    } catch (e) {
      setMessages((m) => [...m, { role: "error", text: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="assistant-page">
      <PageHeading
        eyebrow="A LITTLE CLARITY, WHEN YOU NEED IT"
        title="Think it through, together."
        description="A companion for your curiosity. Grounded in your authorised course material."
      />
      <div className="assistant-layout">
        <section className="assistant-chat">
          <div className="assistant-chat-head">
            <span>
              <Icon name="Sparkles" size={20} />
              <strong>Your learning companion</strong>
            </span>
            <Badge>Reference mode</Badge>
          </div>
          <div className="assistant-messages">
            {!messages.length ? (
              <div className="assistant-empty">
                <div className="assistant-orb">
                  <Icon name="Sparkles" size={35} />
                </div>
                <h2>
                  There’s no such thing
                  <br />
                  as a little question.
                </h2>
                <p>
                  Revisit an idea, explore a concept, or make a little space for
                  practice.
                </p>
                <div className="assistant-suggestions">
                  {[
                    ["Explain the key ideas", "explain", "Lightbulb"],
                    ["Give me a short summary", "summary", "AlignLeft"],
                    ["Make space for practice", "practice", "Brain"],
                    ["Explore flashcards", "flashcards", "Layers"],
                  ].map(([q, m, icon]) => (
                    <button key={m} onClick={() => ask(q, m)} disabled={busy}>
                      <Icon name={icon} size={19} />
                      {q}
                      <Icon name="ArrowUpRight" size={14} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={"chat-message " + m.role}>
                  {m.role === "assistant" && (
                    <span className="message-avatar">
                      <Icon name="Sparkles" size={17} />
                    </span>
                  )}
                  <div>
                    {m.label && <small>{m.label}</small>}
                    <p>{m.text}</p>
                    {m.source && (
                      <>
                        <Link
                          className="chat-source"
                          to={"/lesson/" + m.source.lessonId}
                        >
                          <Icon name="BookOpen" size={12} />
                          Source: {m.source.title}
                          <Icon name="ArrowUpRight" size={12} />
                        </Link>
                        <button
                          className="chat-feedback"
                          onClick={() =>
                            toast(
                              "Please report reference issues through Help & support so an educator can review them.",
                            )
                          }
                        >
                          <Icon name="Flag" size={12} />
                          Report an issue
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            {busy && (
              <div className="chat-message assistant">
                <span className="spinner" />
                Finding a little clarity…
              </div>
            )}
            <div ref={bottom} />
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <label className="sr-only" htmlFor="ask-companion">
              Ask your companion
            </label>
            <input
              id="ask-companion"
              placeholder="What are you curious about?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <button
              className="btn primary"
              disabled={busy || !input.trim()}
              aria-label="Send question"
            >
              <Icon name="ArrowUp" size={18} />
            </button>
          </form>
          <div className="assistant-disclaimer">
            <Icon name="Info" size={12} />
            Reference retrieval only. An AI provider is not connected; answers
            are not generated.
          </div>
        </section>
        <aside className="assistant-context">
          <h3>A little context helps.</h3>
          <p>Your companion only uses the lesson you choose.</p>
          <label className="standalone-label">
            Your course
            <select
              value={course}
              onChange={(e) => {
                setCourse(e.target.value);
                setLessonId(e.target.value + "-lesson-1");
                setMessages([]);
              }}
            >
              {cs.data
                ?.filter((c: Row) => c.joined)
                .map((c: Row) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
            </select>
          </label>
          <label className="standalone-label">
            Lesson context
            <select
              value={lessonId}
              onChange={(e) => {
                setLessonId(e.target.value);
                setMessages([]);
              }}
            >
              {detail.data?.lessons.map((l: Row) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </label>
          <div className="context-note">
            <Icon name="ShieldCheck" size={24} />
            <h4>Intelligence, with intention.</h4>
            <p>
              No grades change, no content is published, and no private learner
              information is shared with an AI provider.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
function Downloads() {
  const [items, setItems] = useState(downloads()),
    [pending, setPending] = useState(queue()),
    [syncing, setSyncing] = useState(false);
  const toast = useToast();
  useEffect(() => {
    const update = () => {
      setItems(downloads());
      setPending(queue());
    };
    window.addEventListener("qubit-cache", update);
    return () => window.removeEventListener("qubit-cache", update);
  }, []);
  const bytes = new Blob([JSON.stringify(items)]).size;
  return (
    <>
      <PageHeading
        eyebrow="LEARNING, EVEN WHEN LIFE GOES OFFLINE"
        title="A little possibility, to go."
        description="Your downloaded reading lessons, local notes, and supported progress sync."
        actions={
          <button
            className="btn"
            disabled={!navigator.onLine || syncing || !pending.length}
            onClick={async () => {
              setSyncing(true);
              await sync();
              setSyncing(false);
              toast(
                queue().length
                  ? "Some changes still need attention."
                  : "Your little steps are all caught up.",
              );
            }}
          >
            <Icon name="CloudUpload" size={16} />
            {syncing ? "Syncing…" : "Sync changes"}
          </button>
        }
      />
      <div className="download-summary">
        <div>
          <Icon name="HardDriveDownload" size={28} />
          <span>
            <strong>{items.length} saved lessons</strong>
            <small>{(bytes / 1024).toFixed(1)} KB used on this device</small>
          </span>
        </div>
        <Badge>
          {pending.length ? pending.length + " pending" : "Up to date"}
        </Badge>
      </div>
      <div className="notice">
        <Icon name="Info" />
        Reading downloads expire after 24 hours. Access is rechecked when
        online. Remove sensitive content on shared devices; this prototype does
        not encrypt local learning files. Quizzes and submissions require a
        connection.
      </div>
      {items.length ? (
        <div className="download-list">
          {items.map((l) => (
            <div className="panel download-row" key={l.id}>
              <span className="download-icon">
                <Icon name="FileText" size={23} />
              </span>
              <div>
                <h3>{l.title}</h3>
                <p>
                  {l.duration} minutes ·{" "}
                  {l.expires > Date.now()
                    ? "Available until " + new Date(l.expires).toLocaleString()
                    : "Expired · download again while online"}
                </p>
              </div>
              <Link
                className={
                  "btn " + (l.expires < Date.now() ? "disabled-link" : "")
                }
                to={"/lesson/" + l.id}
              >
                Open lesson
                <Icon name="ArrowUpRight" size={15} />
              </Link>
              <button
                className="icon-btn"
                aria-label={"Remove " + l.title}
                onClick={() => {
                  removeDownload(l.id);
                  toast("A little space freed up.");
                }}
              >
                <Icon name="Trash2" size={17} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          icon="Download"
          title="Take a little learning with you."
          text="Open a lesson and tap Download to save it for offline reading."
          action={
            <Link className="btn primary" to="/learning">
              Your learning
              <Icon name="ArrowRight" size={16} />
            </Link>
          }
        />
      )}
      <div className="panel sync-panel">
        <div className="panel-heading">
          <div>
            <h2>Your sync queue</h2>
            <p>
              Progress completion is monotonic; duplicate events are ignored by
              the server. Notes remain separate records.
            </p>
          </div>
        </div>
        {pending.length ? (
          pending.map((p) => (
            <div className="sync-row" key={p.id}>
              <Icon name={p.error ? "CircleAlert" : "CloudUpload"} size={19} />
              <div>
                <strong>
                  {p.path.includes("progress")
                    ? "Lesson progress"
                    : "A personal note"}
                </strong>
                <p>{p.error || "Waiting for your connection to return."}</p>
              </div>
              <button
                className="text-link"
                onClick={() => {
                  if (confirm("Discard this unsynced change?")) {
                    localStorage.setItem(
                      cacheKey("queue"),
                      JSON.stringify(queue().filter((q) => q.id !== p.id)),
                    );
                    window.dispatchEvent(new Event("qubit-cache"));
                  }
                }}
              >
                Discard
              </button>
            </div>
          ))
        ) : (
          <div className="sync-empty">
            <Icon name="CloudCheck" size={22} />
            Everything is right where it should be.
          </div>
        )}
      </div>
    </>
  );
}
function Notifications() {
  const { data, error, reload } = useData("/learning/resources/notifications");
  const learning = useData("/me/learning");
  const [filter, setFilter] = useState("All messages"),
    [selected, setSelected] = useState<Row | null>(null);
  const toast = useToast();
  const mark = async (n: Row) => {
    await api("/me/read/" + n.id, {
      method: "PUT",
      body: JSON.stringify({ title: n.title }),
    });
    learning.reload();
  };
  const rows =
    data?.filter(
      (n: Row) =>
        filter === "All messages" ||
        !learning.data?.read?.some((r: Row) => r.id === n.id),
    ) || [];
  return (
    <>
      <PageHeading
        eyebrow="GOOD THINGS TO KNOW"
        title="A little note, just for you."
        description="Updates, gentle reminders, and the moments worth noticing."
        actions={
          <button
            className="btn"
            onClick={async () => {
              try {
                for (const n of data || []) await mark(n);
                toast("You’re all caught up.");
              } catch (e) {
                toast((e as Error).message, "error");
              }
            }}
          >
            <Icon name="CheckCheck" size={16} />
            Mark all as read
          </button>
        }
      />
      <div className="metric-strip">
        {["All messages", "Unread"].map((f) => (
          <button
            key={f}
            className={f === filter ? "selected" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data ? (
        <Loading />
      ) : rows.length ? (
        <div className="notification-list">
          {rows.map((n: Row) => (
            <button
              className={
                "panel notification-card " +
                (learning.data?.read.some((r: Row) => r.id === n.id)
                  ? "read"
                  : "")
              }
              key={n.id}
              onClick={() => {
                setSelected(n);
                mark(n).catch((e) => toast(e.message, "error"));
              }}
            >
              <span className="notification-icon">
                <Icon name="BellRing" size={21} />
              </span>
              <div>
                <h3>{n.title}</h3>
                <p>{n.description}</p>
              </div>
              <Icon name="ChevronRight" size={17} />
            </button>
          ))}
        </div>
      ) : (
        <Empty
          icon="MailCheck"
          title="A little peace and quiet."
          text="You’re all caught up. We’ll let you know when there’s something new."
        />
      )}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div className="editor-content">
            <p>{selected.description}</p>
            <div className="button-row">
              <Link
                className="btn primary"
                to="/learning"
                onClick={() => setSelected(null)}
              >
                Back to your learning
                <Icon name="ArrowRight" size={15} />
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
function Community() {
  const { data, error, reload } = useData("/learning/resources/discussions");
  const [selected, setSelected] = useState<Row | null>(null),
    [reply, setReply] = useState("");
  const toast = useToast();
  return (
    <>
      <PageHeading
        eyebrow="BETTER, TOGETHER"
        title="A little conversation can change a lot."
        description="Ask thoughtful questions. Share a perspective. Make room for someone else’s idea."
      />
      <div className="community-guidelines">
        <Icon name="HeartHandshake" size={26} />
        <p>
          Be curious. Be kind. Share ideas, not private information. Report
          anything that makes this space feel less welcoming.
        </p>
      </div>
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data ? (
        <Loading />
      ) : (
        data.map((d: Row) => (
          <button
            className="panel discussion-card"
            key={d.id}
            onClick={() => setSelected(d)}
          >
            <Avatar name={d.author || "Learner"} />
            <div>
              <small>{d.courseId.replaceAll("-", " ")}</small>
              <h2>{d.title}</h2>
              <p>{d.description}</p>
              <span>
                {d.author} · {d.replies?.length || 0} replies
              </span>
            </div>
            <Icon name="ArrowUpRight" size={20} />
          </button>
        ))
      )}
      {data?.length === 0 && (
        <Empty
          icon="MessagesSquare"
          title="There’s room for your first conversation."
          text="Discussions for your enrolled courses will appear here."
        />
      )}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div className="editor-content">
            <p className="discussion-intro">{selected.description}</p>
            <div className="discussion-replies">
              {selected.replies?.map((r: Row) => (
                <div className="reply" key={r.id}>
                  <Avatar name={r.author} />
                  <div>
                    <strong>{r.author}</strong>
                    <p>{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <label className="standalone-label">
              Add a little perspective
              <textarea
                rows={4}
                placeholder="What have you noticed?"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
            </label>
            <button
              className="btn primary"
              disabled={reply.trim().length < 2 || selected.status !== "Open"}
              onClick={async () => {
                try {
                  setSelected(
                    await post("/discussions/" + selected.id + "/replies", {
                      text: reply,
                    }),
                  );
                  setReply("");
                  reload();
                  toast("Thanks for sharing a little perspective.");
                } catch (e) {
                  toast((e as Error).message, "error");
                }
              }}
            >
              Join the conversation
              <Icon name="Send" size={15} />
            </button>
            <Link
              className="report-link"
              to="/support"
              onClick={() => setSelected(null)}
            >
              <Icon name="Flag" size={12} />
              Report a conversation
            </Link>
          </div>
        </Modal>
      )}
    </>
  );
}
function LiveSessions() {
  const { data, error, reload } = useData("/learning/resources/sessions");
  return (
    <>
      <PageHeading
        eyebrow="A SHARED MOMENT TO LEARN"
        title="Good ideas love good company."
        description="A place for conversations, shared discovery, and a fresh perspective."
      />
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data ? (
        <Loading />
      ) : (
        data.map((s: Row) => (
          <section className="panel live-card" key={s.id}>
            <div className="live-visual">
              <Art color="peach" variant={1} />
              <span>
                <Icon name="Video" size={27} />
              </span>
            </div>
            <div className="live-body">
              <Badge>{s.status}</Badge>
              <h2>{s.title}</h2>
              <p>
                With {s.instructor} · {s.duration} minutes
              </p>
              <div className="live-date">
                <Icon name="CalendarDays" size={18} />
                {new Date(s.date).toLocaleString("en-IN", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </div>
              <div className="button-row">
                <button
                  className="btn"
                  onClick={() => {
                    const start = new Date(s.date),
                      end = new Date(start.getTime() + s.duration * 60000),
                      date = (d: Date) =>
                        d.toISOString().replace(/[-:]/g, "").split(".")[0] +
                        "Z";
                    download(
                      "qubit-live-session.ics",
                      `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Qubit//LMS//EN\r\nBEGIN:VEVENT\r\nUID:${s.id}@qubit.demo\r\nDTSTAMP:${date(new Date())}\r\nDTSTART:${date(start)}\r\nDTEND:${date(end)}\r\nSUMMARY:${s.title.replace(/[\n\r,;]/g, " ")}\r\nEND:VEVENT\r\nEND:VCALENDAR`,
                      "text/calendar",
                    );
                  }}
                >
                  <Icon name="CalendarPlus" size={16} />
                  Add to calendar
                </button>
                {s.url &&
                /^https:\/\//.test(s.url) &&
                s.status === "Scheduled" ? (
                  <a
                    className="btn primary"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Join session
                    <Icon name="ArrowUpRight" size={16} />
                  </a>
                ) : (
                  <button className="btn primary" disabled>
                    <Icon name="Video" size={16} />
                    Join link not configured
                  </button>
                )}
              </div>
              <small>
                Times shown in your device timezone. No conferencing service is
                connected by default.
              </small>
            </div>
          </section>
        ))
      )}
      {data?.length === 0 && (
        <Empty
          icon="Video"
          title="Good company is on the horizon."
          text="Live sessions for your enrolled courses will appear here."
        />
      )}
    </>
  );
}
function Certificates() {
  const { data, error, reload } = useData("/learning/resources/certificates");
  const cs = useData("/catalog/courses");
  const [selected, setSelected] = useState<Row | null>(null),
    [verified, setVerified] = useState<Row | null>(null),
    [busy, setBusy] = useState("");
  const toast = useToast();
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE RECOGNITION. A REAL ACHIEVEMENT."
        title="You made room to grow."
        description="Every certificate represents completed learning and demonstrated assessment evidence."
      />
      {error && <ErrorState error={error} retry={reload} />}
      <div className="certificate-eligibility">
        <div>
          <Icon name="Award" size={28} />
          <h2>Your next achievement is taking shape.</h2>
          <p>
            Complete all required lessons and pass the course assessment with at
            least 80%.
          </p>
        </div>
        <div>
          {cs.data
            ?.filter((c: Row) => c.joined)
            .map((c: Row) => (
              <div className="eligibility-row" key={c.id}>
                <span>
                  {c.title}
                  <small>
                    {c.completed} of {c.total} required lessons complete
                  </small>
                </span>
                <button
                  className="btn"
                  disabled={!!busy}
                  onClick={async () => {
                    setBusy(c.id);
                    try {
                      const cert = await post(
                        "/courses/" + c.id + "/certificate",
                      );
                      reload();
                      setSelected(cert);
                      toast("You made it. Your certificate is ready.");
                    } catch (e) {
                      toast((e as Error).message, "error");
                    } finally {
                      setBusy("");
                    }
                  }}
                >
                  {busy === c.id ? "Checking…" : "Check eligibility"}
                  <Icon name="ArrowUpRight" size={15} />
                </button>
              </div>
            ))}
        </div>
      </div>
      {data?.length ? (
        <div className="certificate-grid">
          {data.map((c: Row) => (
            <button
              key={c.id}
              className="certificate-card"
              onClick={() => setSelected(c)}
            >
              <Brand small />
              <Icon name="Award" size={37} />
              <small>CERTIFICATE OF COMPLETION</small>
              <h2>{c.title}</h2>
              <p>{c.name}</p>
              <Badge>{c.status}</Badge>
              <span>{c.id}</span>
            </button>
          ))}
        </div>
      ) : (
        data && (
          <Empty
            icon="Award"
            title="An achievement worth working towards."
            text="Your earned certificates will be here, ready to revisit and share."
          />
        )
      )}
      {selected && (
        <Modal
          wide
          title="A little recognition for your journey."
          onClose={() => {
            setSelected(null);
            setVerified(null);
          }}
        >
          <div className="certificate-print" id="certificate">
            <Brand />
            <span className="certificate-border-corner" />
            <span className="eyebrow">CERTIFICATE OF COMPLETION</span>
            <p>This is to recognise</p>
            <h1>{selected.name}</h1>
            <p>
              for completing the required learning and passing the assessment in
            </p>
            <h2>{selected.title}</h2>
            <Icon name="Award" size={45} />
            <div>
              <span>{selected.issuer}</span>
              <span>
                Issued {new Date(selected.issued).toLocaleDateString()}
              </span>
            </div>
            <small>
              {selected.id} · Version {selected.version} · {selected.status}
            </small>
          </div>
          <div className="editor-content">
            <div className="button-row">
              <button className="btn primary" onClick={() => window.print()}>
                <Icon name="Printer" size={16} />
                Print / Save as PDF
              </button>
              <button
                className="btn"
                onClick={async () => {
                  try {
                    setVerified(
                      await api("/certificates/" + selected.id + "/verify"),
                    );
                    toast("Certificate verification complete.");
                  } catch (e) {
                    toast((e as Error).message, "error");
                  }
                }}
              >
                <Icon name="BadgeCheck" size={16} />
                Verify authenticity
              </button>
              <button
                className="btn"
                onClick={async () => {
                  const text = `${selected.name} · ${selected.title} · ${selected.id}`;
                  try {
                    if (navigator.share)
                      await navigator.share({
                        title: "Qubit certificate",
                        text,
                      });
                    else {
                      await navigator.clipboard.writeText(text);
                      toast("Certificate details copied.");
                    }
                  } catch {
                    toast("Sharing is not available on this device.", "error");
                  }
                }}
              >
                <Icon name="Share2" size={16} />
                Share details
              </button>
            </div>
            {verified && (
              <div className="notice">
                <Icon name="BadgeCheck" />
                Verification: {verified.status}. Issued by {verified.issuer} to{" "}
                {verified.name}.
              </div>
            )}
            <small className="subtle">
              Certificate verification is served by the prototype API. A public
              deployment URL is needed for externally shareable verification.
            </small>
          </div>
        </Modal>
      )}
    </>
  );
}
function Profile({
  user,
  onUpdate,
  onLogout,
}: {
  user: Row;
  onUpdate: (u: Row) => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState("Your profile"),
    [request, setRequest] = useState(""),
    [goal, setGoal] = useState(String(user.preferences?.weeklyGoal || 120)),
    [interest, setInterest] = useState<string[]>(
      user.preferences?.interests || [],
    );
  const sessions = useData("/me/sessions");
  const requests = useData("/learning/resources/privacy");
  const toast = useToast();
  const savePreferences = async (v: Row) => {
    const u = await patch("/me", { preferences: v });
    onUpdate(u);
    toast("A little more you. Preferences saved.");
  };
  return (
    <>
      <PageHeading
        eyebrow="YOUR SPACE. YOUR WAY."
        title="Make yourself at home."
        description="A few thoughtful settings to make learning work better for you."
      />
      <div className="profile-banner">
        <Avatar name={user.name} size="large" />
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <span className="profile-badge">
          <Icon name="Sprout" size={16} />
          Always growing.
        </span>
      </div>
      <div className="profile-layout">
        <aside className="profile-nav">
          {[
            ["Your profile", "CircleUserRound"],
            ["Learning preferences", "Compass"],
            ["Appearance & access", "Sun"],
            ["Notifications", "Bell"],
            ["Account security", "ShieldCheck"],
            ["Privacy & your data", "LockKeyhole"],
          ].map(([t, icon]) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              <Icon name={icon} size={18} />
              {t}
              <Icon name="ChevronRight" size={14} />
            </button>
          ))}
          <button className="signout-link" onClick={onLogout}>
            <Icon name="LogOut" size={18} />
            Sign out
          </button>
        </aside>
        <section className="panel profile-settings">
          <div className="panel-heading">
            <div>
              <h2>{tab}</h2>
              <p>A few small choices that make a meaningful difference.</p>
            </div>
          </div>
          {tab === "Your profile" ? (
            <Form
              fields={[{ name: "name", label: "Your name", required: true }]}
              initial={user}
              onSubmit={async (v) => {
                onUpdate(await patch("/me", v));
                toast("Your profile, updated.");
              }}
            />
          ) : tab === "Learning preferences" ? (
            <div className="editor-content">
              <h3>A little time. A lot of possibility.</h3>
              <p className="subtle">
                Set a comfortable weekly target. You can change it any time.
              </p>
              <div className="goal-options">
                {[60, 120, 180, 300].map((n) => (
                  <button
                    key={n}
                    className={goal === String(n) ? "selected" : ""}
                    onClick={() => setGoal(String(n))}
                  >
                    <strong>{n}</strong>
                    <span>min / week</span>
                  </button>
                ))}
              </div>
              <label className="standalone-label">Your interests</label>
              <div className="category-chips">
                {[
                  "Design",
                  "Business",
                  "Data & Technology",
                  "Personal growth",
                ].map((s) => (
                  <button
                    key={s}
                    className={interest.includes(s) ? "active" : ""}
                    onClick={() =>
                      setInterest(
                        interest.includes(s)
                          ? interest.filter((x) => x !== s)
                          : [...interest, s],
                      )
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                className="btn primary"
                onClick={() =>
                  savePreferences({
                    weeklyGoal: Number(goal),
                    interests: interest,
                  })
                }
              >
                Save learning preferences
                <Icon name="Check" size={16} />
              </button>
            </div>
          ) : tab === "Appearance & access" ? (
            <Form
              fields={[
                {
                  name: "theme",
                  label: "Appearance",
                  type: "select",
                  options: ["light", "dark"],
                  required: true,
                },
                {
                  name: "textSize",
                  label: "Reading text",
                  type: "select",
                  options: ["standard", "large"],
                  required: true,
                },
                {
                  name: "language",
                  label: "Preferred content language · UI currently English",
                  type: "select",
                  options: ["English", "Hindi", "Spanish", "French"],
                  required: true,
                },
                {
                  name: "timezone",
                  label: "Preferred timezone",
                  type: "select",
                  options: [
                    "Asia/Kolkata",
                    "UTC",
                    "Europe/London",
                    "America/New_York",
                  ],
                  required: true,
                },
              ]}
              initial={{
                theme: "light",
                textSize: "standard",
                language: "English",
                timezone: "Asia/Kolkata",
                ...user.preferences,
              }}
              onSubmit={savePreferences}
            />
          ) : tab === "Notifications" ? (
            <>
              <div className="editor-content">
                <div className="notice">
                  <Icon name="Bell" />
                  Preferences are saved. Push and email delivery require
                  configured providers; in-app messages are available now.
                </div>
              </div>
              <Form
                fields={[
                  {
                    name: "emailNotifications",
                    label: "Email learning reminders",
                    type: "checkbox",
                  },
                  {
                    name: "pushNotifications",
                    label: "Push learning reminders",
                    type: "checkbox",
                  },
                  {
                    name: "quietHours",
                    label: "Quiet hours preference",
                    placeholder: "e.g. 21:00–08:00",
                  },
                ]}
                initial={user.preferences}
                onSubmit={savePreferences}
              />
            </>
          ) : tab === "Account security" ? (
            <>
              <div className="editor-content">
                <h3>Keep your space safe.</h3>
                <div className="notice spaced">
                  <Icon name="Fingerprint" />
                  Biometric unlock and secure native session storage require
                  device integration and testing. They are not enabled in this
                  prototype.
                </div>
                <h3>Change your password</h3>
              </div>
              <Form
                fields={[
                  {
                    name: "current",
                    label: "Current password",
                    type: "password",
                    required: true,
                  },
                  {
                    name: "password",
                    label: "New password · at least 12 characters",
                    type: "password",
                    required: true,
                  },
                ]}
                onSubmit={async (v) => {
                  await post("/me/password", v);
                  toast("Password updated. Other sessions have been revoked.");
                }}
                label="Update password"
              />
              <div className="editor-content">
                <h3>Your signed-in devices</h3>
                {sessions.error ? (
                  <ErrorState error={sessions.error} retry={sessions.reload} />
                ) : (
                  sessions.data?.map((s: Row) => (
                    <div className="device-row" key={s.id}>
                      <Icon name="MonitorSmartphone" size={22} />
                      <div>
                        <strong>
                          {s.current ? "This device" : "Another device"}
                        </strong>
                        <small>{s.device.slice(0, 50)}…</small>
                      </div>
                      {s.current ? (
                        <Badge>Current</Badge>
                      ) : (
                        <button
                          className="btn danger"
                          onClick={async () => {
                            await api("/me/sessions/" + s.id, {
                              method: "DELETE",
                            });
                            sessions.reload();
                            toast("Device signed out.");
                          }}
                        >
                          Sign out
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="editor-content">
              <div className="notice">
                <Icon name="LockKeyhole" />
                You’re in control of your data. Optional consents are off by
                default. Deletion requests require identity and retention
                review.
              </div>
              <div className="consent-controls">
                {[
                  [
                    "aiConsent",
                    "Optional AI assistance consent",
                    "No provider receives your data in reference mode.",
                  ],
                  [
                    "analyticsConsent",
                    "Optional product analytics",
                    "Required security and learning records remain available.",
                  ],
                ].map(([key, title, description]) => (
                  <div className="setting-row" key={key}>
                    <div>
                      <strong>{title}</strong>
                      <p>{description}</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={!!user.preferences?.[key]}
                      aria-label={title}
                      className={
                        "toggle " + (user.preferences?.[key] ? "on" : "")
                      }
                      onClick={() =>
                        savePreferences({ [key]: !user.preferences?.[key] })
                      }
                    >
                      <span />
                    </button>
                  </div>
                ))}
              </div>
              <h3 className="spaced">Your data, available to you.</h3>
              <p className="subtle">
                Export your current profile and learning records, or start a
                verified privacy request.
              </p>
              <div className="button-row">
                <button
                  className="btn"
                  onClick={async () => {
                    try {
                      download(
                        "my-qubit-data.json",
                        JSON.stringify(await api("/me/export"), null, 2),
                      );
                      toast("Your personal data export is ready.");
                    } catch (e) {
                      toast((e as Error).message, "error");
                    }
                  }}
                >
                  <Icon name="Download" size={16} />
                  Download my data
                </button>
                <button
                  className="btn danger"
                  onClick={() => setRequest("Account deletion")}
                >
                  <Icon name="UserRoundX" size={16} />
                  Request account deletion
                </button>
              </div>
              {requests.data?.map((r: Row) => (
                <div className="privacy-request-row" key={r.id}>
                  <strong>{r.type}</strong>
                  <Badge>{r.status}</Badge>
                  <small>{new Date(r.created).toLocaleDateString()}</small>
                </div>
              ))}
              <details className="legal-details">
                <summary>Prototype terms & privacy notice</summary>
                <p>
                  This is a development demonstration with synthetic seed data.
                  Locally created accounts, course activity, notes, and support
                  messages are stored in the local prototype database. Do not
                  enter sensitive personal information. Optional downloads are
                  stored on your device until expiry or removal. This notice is
                  not a production legal policy.
                </p>
              </details>
            </div>
          )}
        </section>
      </div>
      {request && (
        <Modal
          title="Request account deletion?"
          subtitle="This opens a review request. It does not immediately delete your records."
          onClose={() => setRequest("")}
        >
          <div className="editor-content">
            <p>
              We’ll record your request for an administrator to verify identity
              and review any required retention. Your account remains accessible
              during review.
            </p>
            <div className="button-row">
              <button className="btn" onClick={() => setRequest("")}>
                Keep learning
              </button>
              <button
                className="btn danger"
                onClick={async () => {
                  try {
                    await post("/me/privacy", { type: request });
                    setRequest("");
                    requests.reload();
                    toast("Privacy request recorded for review.");
                  } catch (e) {
                    toast((e as Error).message, "error");
                  }
                }}
              >
                Create deletion request
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
function Support() {
  const { data, error, reload } = useData("/learning/resources/tickets");
  const [creating, setCreating] = useState(false),
    [selected, setSelected] = useState<Row | null>(null);
  const toast = useToast();
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE HELP GOES A LONG WAY"
        title="We’re here for your next step."
        description="Something getting in the way of learning? Let’s work it out."
        actions={
          <button className="btn primary" onClick={() => setCreating(true)}>
            <Icon name="Plus" size={17} />
            Ask for a little help
          </button>
        }
      />
      <div className="support-hero">
        <Icon name="LifeBuoy" size={44} />
        <div>
          <h2>Learning should feel possible.</h2>
          <p>
            Course access, a technical issue, or a question about your account.
            There’s room for all of it here.
          </p>
        </div>
      </div>
      <div className="faq-grid">
        {[
          [
            "How do I learn offline?",
            "Open an enrolled lesson, then tap the Download icon. Eligible reading content is available on this device for 24 hours. Progress and notes queue until you reconnect.",
          ],
          [
            "How do I earn a certificate?",
            "Complete all required lessons and pass the course assessment with at least 80%. Open Certificates and check your eligibility.",
          ],
          [
            "Where is my saved work?",
            "Lesson notes are saved to your account when online. Assignment drafts are saved on this device until submitted. Check Downloads for pending sync.",
          ],
          [
            "Can I use the app on my phone?",
            "Yes. The responsive app works in a mobile browser, includes installable web support, and has separate Capacitor Android and iOS projects. Native releases require signing and device validation.",
          ],
        ].map(([q, a]) => (
          <details key={q} className="panel">
            <summary>
              {q}
              <Icon name="Plus" size={17} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <div className="learner-section-heading">
        <div>
          <h2>Your conversations with us.</h2>
          <p>Questions, updates, and a clear path forward.</p>
        </div>
      </div>
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : data?.length ? (
        <div className="support-cases">
          {data.map((t: Row) => (
            <button
              className="panel support-case"
              key={t.id}
              onClick={() => setSelected(t)}
            >
              <Icon name="MessageSquareText" size={23} />
              <div>
                <h3>{t.title}</h3>
                <p>
                  {t.category} · {t.responses?.length || 0} responses
                </p>
              </div>
              <Badge>{t.status}</Badge>
              <Icon name="ArrowUpRight" size={17} />
            </button>
          ))}
        </div>
      ) : (
        data && (
          <Empty
            icon="LifeBuoy"
            title="A little help, whenever you need it."
            text="Your support conversations will appear here."
          />
        )
      )}
      {creating && (
        <Modal
          title="Let’s make learning a little easier."
          onClose={() => setCreating(false)}
        >
          <Form
            fields={[
              {
                name: "title",
                label: "What can we help with?",
                required: true,
              },
              {
                name: "category",
                label: "A little context",
                type: "select",
                options: [
                  "Login",
                  "Course access",
                  "Playback",
                  "Assessment",
                  "Billing",
                  "Content report",
                  "Other",
                ],
                required: true,
              },
              {
                name: "description",
                label: "Tell us a little more",
                type: "textarea",
                required: true,
              },
            ]}
            initial={{ category: "Other" }}
            onSubmit={async (v) => {
              await post("/support", v);
              setCreating(false);
              reload();
              toast("Your question is with the support team.");
            }}
            label="Send your message"
          />
        </Modal>
      )}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div className="editor-content">
            <Badge>{selected.status}</Badge>
            <p className="discussion-intro">{selected.description}</p>
            {selected.responses?.map((r: Row, i: number) => (
              <div className="reply" key={i}>
                <strong>{r.author}</strong>
                <p>{r.text}</p>
              </div>
            ))}
            {!selected.responses?.length && (
              <p className="subtle small">
                Your question is waiting for a little attention from our team.
              </p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

export {
  Quiz,
  Assignments,
  Downloads,
  Notifications,
  Community,
  LiveSessions,
  Certificates,
  Support,
  Assistant,
};
