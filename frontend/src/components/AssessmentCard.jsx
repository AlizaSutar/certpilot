import React, { useState } from "react";
import { Target, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import Card from "./Card";

export default function AssessmentCard({ assessment, onSubmit, loading }) {
  const [answers, setAnswers] = useState({});
  if (!assessment) return null;

  const { questions, score, passed, status, topic_breakdown = {}, remediation } = assessment;
  const qlist = questions?.questions || [];
  const isPending = status === "pending" || score === null || score === undefined;

  const pick = (qid, letter) => setAnswers((prev) => ({ ...prev, [qid]: letter }));

  const allAnswered = qlist.length > 0 && qlist.every((q) => answers[String(q.id)]);

  return (
    <Card
      title="Assessment Agent"
      icon={Target}
      accent="#4CC9F0"
      badge={<span className="font-mono text-[11px] text-foundry">Foundry IQ</span>}
    >
      {!isPending && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-panel-border bg-panel-raised p-3">
          {passed ? (
            <CheckCircle2 className="h-5 w-5 text-workiq" />
          ) : (
            <XCircle className="h-5 w-5 text-risk-high" />
          )}
          <div>
            <div className="font-display text-lg font-semibold text-ink">{score}%</div>
            <div className="text-xs text-ink-muted">{passed ? "Passed" : "Needs remediation"} · {assessment.correct}/{assessment.total} correct</div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {qlist.map((q) => {
          const given = answers[String(q.id)];
          const showResult = !isPending;
          return (
            <div key={q.id} className="rounded-xl border border-panel-border bg-panel-raised p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-foundry">{q.topic}</span>
                <span className="text-[10px] uppercase tracking-wide text-ink-faint">{q.difficulty}</span>
              </div>
              <div className="mt-1 text-sm text-ink">{q.question}</div>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {Object.entries(q.options || {}).map(([letter, text]) => {
                  const isGiven = given === letter;
                  const isCorrect = q.correct_answer === letter;
                  let style = "border-panel-border bg-panel-surface text-ink-muted hover:border-amber-glow/30";
                  if (showResult && isCorrect) style = "border-workiq/40 bg-workiq/10 text-workiq";
                  else if (showResult && isGiven && !isCorrect) style = "border-risk-high/40 bg-risk-high/10 text-risk-high";
                  else if (!showResult && isGiven) style = "border-amber-glow/40 bg-amber-glow/10 text-amber-glow";

                  return (
                    <button
                      key={letter}
                      disabled={showResult}
                      onClick={() => pick(String(q.id), letter)}
                      className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors ${style}`}
                    >
                      <span className="font-mono">{letter}.</span> {text}
                    </button>
                  );
                })}
              </div>
              {showResult && (
                <div className="mt-2 text-xs text-ink-faint">
                  {q.explanation} <span className="font-mono text-foundry/80">{q.citation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isPending && qlist.length > 0 && (
        <button
          onClick={() => onSubmit(answers)}
          disabled={!allAnswered || loading}
          className="mt-4 w-full rounded-xl border border-amber-glow/30 bg-amber-glow/15 px-4 py-2 text-sm font-medium text-amber-glow transition-colors hover:bg-amber-glow/25 disabled:opacity-40"
        >
          Submit assessment
        </button>
      )}

      {remediation && remediation.remediation_needed && (
        <div className="mt-4 rounded-xl border border-risk-high/25 bg-risk-high/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-risk-high">
            <RotateCcw className="h-3 w-3" /> Smart remediation loop-back
          </div>
          <p className="text-xs text-ink-muted">{remediation.confidence_boost}</p>
          <div className="mt-2 space-y-1.5">
            {remediation.daily_plan?.map((d, i) => (
              <div key={i} className="text-xs text-ink-muted">
                <span className="font-mono text-ink-faint">Day {d.day}</span> — <span className="text-ink">{d.focus_topic}</span>: {d.study_actions?.join("; ")}
                <span className="ml-1 text-foundry/80 font-mono">{d.citation}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-amber-glow">Ready in: {remediation.estimated_ready_in}</div>
        </div>
      )}

      {!isPending && !remediation && assessment.next_recommendation && (
        <div className="mt-4 rounded-xl border border-workiq/25 bg-workiq/5 p-3 text-xs text-ink-muted">
          {assessment.next_recommendation}
        </div>
      )}
    </Card>
  );
}
