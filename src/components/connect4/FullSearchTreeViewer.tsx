import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward, X } from "lucide-react";
import type { AIResult } from "@/lib/connect4/types";
import { SearchTree } from "./SearchTree";

interface Props {
  result: AIResult | null;
  onClose: () => void;
}

export function FullSearchTreeViewer({ result, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const active = result?.playback[step] ?? null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!playing || !result?.playback.length) return;
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= result.playback.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 520);
    return () => window.clearInterval(timer);
  }, [playing, result]);

  if (!result) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-background/95 p-6">
        <div className="panel max-w-md rounded-2xl p-6 text-center">
          <div className="font-display text-xl font-semibold">
            No search tree yet
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Make a move first so the AI can generate a minimax tree.
          </p>
          <button
            onClick={onClose}
            className="mt-5 rounded-xl border border-[color:var(--panel-border)] px-4 py-2 text-sm"
          >
            Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[radial-gradient(circle_at_top,var(--card),var(--background)_60%)] text-foreground">
      <header className="flex flex-wrap items-center gap-3 border-b border-[color:var(--panel-border)] bg-background/75 px-5 py-3 backdrop-blur">
        <div>
          <div className="font-display text-xl font-semibold">
            Full AI Search Tree
          </div>
          <div className="text-xs text-muted-foreground">
            Interactive minimax traversal debugger · utility propagation ·
            alpha-beta pruning
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Pill
            label="Algorithm"
            value={
              result.options.useAlphaBeta ? "Minimax + αβ" : "Minimax only"
            }
          />
          <Pill label="Depth" value={result.depthReached.toString()} />
          <Pill label="Nodes" value={result.nodesEvaluated.toLocaleString()} />
          <Pill label="Pruned" value={result.nodesPruned.toLocaleString()} />
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[color:var(--panel-border)] bg-card/60 hover:border-foreground/30"
            aria-label="Close full search tree"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 gap-4 p-4 xl:grid-cols-[1fr_360px]">
        <section className="panel min-w-0 rounded-2xl p-4">
          <SearchTree
            tree={result.tree}
            bestCol={result.bestCol}
            activeNodeId={active?.nodeId}
            fullscreen
          />
        </section>

        <aside className="panel flex min-h-0 flex-col gap-4 rounded-2xl p-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Step-by-step minimax explorer
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Control
                label="Previous step"
                onClick={() => setStep((i) => Math.max(0, i - 1))}
              >
                <SkipBack className="h-4 w-4" />
              </Control>
              <Control
                label={playing ? "Pause" : "Play"}
                onClick={() => setPlaying((v) => !v)}
              >
                {playing ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Control>
              <Control
                label="Next step"
                onClick={() =>
                  setStep((i) => Math.min(result.playback.length - 1, i + 1))
                }
              >
                <SkipForward className="h-4 w-4" />
              </Control>
              <Control
                label="Reset"
                onClick={() => {
                  setStep(0);
                  setPlaying(false);
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Control>
              <button
                onClick={() => {
                  setStep(result.playback.length - 1);
                  setPlaying(false);
                }}
                className="rounded-lg border border-[color:var(--panel-border)] px-3 py-2 text-xs hover:border-foreground/30"
              >
                Jump to End
              </button>
              <div className="ml-auto text-xs tabular-nums text-muted-foreground">
                {step + 1}/{result.playback.length}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[color:var(--panel-border)] bg-card/50 p-4">
            <div className="font-display text-lg font-semibold">
              {active ? eventTitle(active.event) : "Traversal ready"}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {active?.label ??
                "Press play to animate recursive expansion and backtracking."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Mini label="Current depth" value={active?.depth ?? 0} />
              <Mini
                label="Current best"
                value={
                  active?.bestCol !== undefined
                    ? `c${active.bestCol + 1}`
                    : `c${result.bestCol + 1}`
                }
              />
              <Mini
                label="Best score"
                value={
                  active?.bestScore !== undefined
                    ? fmt(active.bestScore)
                    : fmt(result.bestScore)
                }
              />
              <Mini
                label="α / β"
                value={`${fmt(active?.alpha)} / ${fmt(active?.beta)}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Mini
              label="Branching factor"
              value={result.branchingFactor.toFixed(2)}
            />
            <Mini
              label="Effective b"
              value={result.effectiveBranchingFactor.toFixed(2)}
            />
            <Mini
              label="Evaluated states"
              value={result.evaluatedStates.toLocaleString()}
            />
            <Mini
              label="Recursive calls"
              value={result.recursiveCalls.toLocaleString()}
            />
          </div>

          <div className="rounded-xl border border-[color:var(--panel-border)] bg-card/40 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/90">
              Academic reading:
            </span>{" "}
            MAX selects the successor with maximum backed-up utility; MIN models
            the adversary; alpha and beta bounds prove when a subtree cannot
            affect the root decision.
          </div>
        </aside>
      </main>
    </div>
  );
}

function Control({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-lg border border-[color:var(--panel-border)] bg-card/60 hover:border-foreground/30"
    >
      {children}
    </button>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--panel-border)] bg-card/60 px-3 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[color:var(--panel-border)] bg-background/35 p-2">
      <div className="font-display text-base font-semibold tabular-nums">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

const fmt = (n?: number) => {
  if (n === undefined) return "?";
  if (n === Infinity) return "+∞";
  if (n === -Infinity) return "-∞";
  if (Math.abs(n) >= 1_000_000) return n > 0 ? "+∞" : "-∞";
  return n.toFixed(0);
};

const eventTitle = (event: string) =>
  event === "prune"
    ? "Pruning event"
    : event === "evaluate"
      ? "Heuristic / terminal evaluation"
      : event === "return" || event === "best"
        ? "Utility backtracking"
        : "Recursive expansion";
