import { useState } from "react";
import { Link } from "react-router-dom";
import {
  post,
  useData,
  useToast,
  Icon,
  Badge,
  Modal,
  Form,
  Loading,
  ErrorState,
  Empty,
} from "./ui";
import type { Row } from "./ui";
import { date } from "./coaching-ui";
export function PracticalLab() {
  const d = useData("/academy/practicals"),
    catalog = useData("/coaching/catalog"),
    batches = useData("/academy/batches"),
    toast = useToast();
  const [create, setCreate] = useState(false);
  const eligible = (catalog.data || []).filter(
    (c: Row) => c.accessible && c.joined,
  );
  return (
    <>
      <div className="mobile-page-heading">
        <span className="eyebrow">OBSERVE · DOCUMENT · IMPROVE</span>
        <h1>Your repair bench</h1>
        <p>Put the lesson into practice. Learn from your trainer’s feedback.</p>
      </div>
      <section className="bench-brief">
        <span className="bench-number">01</span>
        <div>
          <h2>Document a diagnosis</h2>
          <p>
            Choose an unpowered training board. Record the symptom, safe
            preparation, observations and your next test plan.
          </p>
          <small>
            Never submit customer passwords or personal files. Practise under
            supervision.
          </small>
        </div>
      </section>
      <button
        className="btn primary bench-submit"
        onClick={() => setCreate(true)}
      >
        <Icon name="Plus" size={18} />
        Submit bench work
      </button>
      <div className="mobile-section-title">
        <div>
          <h2>Your practical work</h2>
          <p>Progress comes from careful observation.</p>
        </div>
      </div>
      {d.error ? (
        <ErrorState error={d.error} retry={d.reload} />
      ) : !d.data ? (
        <Loading />
      ) : (
        <div className="bench-submissions">
          {d.data.map((p: Row) => (
            <article className="bench-submission" key={p.id}>
              <div className="card-top">
                <span className="eyebrow">
                  {catalog.data?.find((c: Row) => c.id === p.courseId)
                    ?.category || "BENCH WORK"}
                </span>
                <Badge>{p.status}</Badge>
              </div>
              <h3>{p.title}</h3>
              <p className="observation-text">{p.observation}</p>
              <small>Submitted {date(p.created)}</small>
              {p.feedback && (
                <div className="review-feedback">
                  <strong>Trainer feedback · {p.score}/100</strong>
                  <p>{p.feedback}</p>
                  <small>
                    {p.reviewer} · {date(p.reviewed)}
                  </small>
                </div>
              )}
            </article>
          ))}
          {!d.data.length && (
            <Empty
              title="Make your first observation"
              text="Your submitted practical tasks and trainer reviews appear here."
            />
          )}
        </div>
      )}
      <div className="mobile-section-title">
        <div>
          <h2>Your training batches</h2>
          <p>Scheduled by the institute. All timings in IST.</p>
        </div>
      </div>
      {batches.error ? (
        <ErrorState error={batches.error} />
      ) : !batches.data ? (
        <Loading />
      ) : batches.data.length ? (
        batches.data.map((b: Row) => (
          <article className="bench-submission" key={b.id}>
            <Badge>{b.status}</Badge>
            <h3>{b.name}</h3>
            <p>{b.trainer}</p>
            <p>
              <Icon name="CalendarDays" size={16} /> {b.schedule}
            </p>
            <small>
              {date(b.starts)} – {date(b.ends)}
            </small>
          </article>
        ))
      ) : (
        <p className="muted">Your institute will assign your training batch.</p>
      )}
      {create && (
        <Modal
          title="Submit practical work"
          subtitle="Use an unpowered training board under trainer supervision."
          onClose={() => setCreate(false)}
        >
          {eligible.length ? (
            <Form
              fields={[
                {
                  name: "courseId",
                  label: "Course",
                  type: "select",
                  options: eligible.map((c: Row) => ({
                    label: c.title,
                    value: c.id,
                  })),
                  required: true,
                },
                {
                  name: "title",
                  label: "Practical title",
                  required: true,
                  placeholder: "No-power laptop · visual inspection",
                },
                {
                  name: "observation",
                  label: "Observations & safe test plan",
                  type: "textarea",
                  required: true,
                  help: "At least 60 characters: model, symptom, safety checks, observations and next steps. No customer personal data.",
                },
              ]}
              initial={{ courseId: eligible[0].id }}
              label="Send to trainer"
              onSubmit={async (v) => {
                await post("/academy/practicals", v);
                setCreate(false);
                d.reload();
                toast("Bench work submitted for review.");
              }}
            />
          ) : (
            <>
              <p>Join an approved course to submit practical work.</p>
              <Link className="btn primary" to="/courses">
                Explore courses
              </Link>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
