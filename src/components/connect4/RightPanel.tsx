import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { AIResult, SearchTimelineStep } from "@/lib/connect4/types";
import { ScoreBars } from "./ScoreBars";
import { SearchTree } from "./SearchTree";

interface Props {
  thinking: boolean;
  result: AIResult | null;
  enabled: boolean;
  onOpenTree?: () => void;
  demoMode?: boolean;
}

export function RightPanel({
  thinking,
  result,
  enabled,
  onOpenTree,
  demoMode = false,
}: Props) {
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const currentStep = result?.playback[playbackIndex] ?? null;

  useEffect(() => {
    setPlaybackIndex(0);
    setAutoPlay(demoMode);
  }, [result, demoMode]);

  useEffect(() => {
    if (!autoPlay || !result?.playback.length) return;
    const timer = window.setInterval(() => {
      setPlaybackIndex((i) => {
        if (i >= result.playback.length - 1) {
          setAutoPlay(false);
          return i;
        }
        return i + 1;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [autoPlay, result]);

  return (
    <aside className="panel rounded-2xl p-4 flex flex-col gap-4 h-full min-h-0 overflow-y-auto scroll-thin">
      <div>
        <div className="font-display text-lg font-semibold">
          AI Reasoning Console
        </div>
        <div className="text-xs text-muted-foreground">
          {enabled
            ? "Minimax traversal, utility propagation, and pruning analytics"
            : "Visualization disabled"}
        </div>
      </div>

      {thinking && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>AI is thinking</span>
          <span
            className="thinking-dot inline-block w-1.5 h-1.5 rounded-full bg-foreground/70"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="thinking-dot inline-block w-1.5 h-1.5 rounded-full bg-foreground/70"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="thinking-dot inline-block w-1.5 h-1.5 rounded-full bg-foreground/70"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      )}

      {!enabled && result && (
        <div className="text-xs text-muted-foreground">
          AI chose column {result.bestCol + 1}.
        </div>
      )}

      {enabled && result && !thinking && (
        <>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Per-column score
            </div>
            <div className="panel rounded-xl p-3">
              <ScoreBars
                perColumn={result.perColumn}
                bestCol={result.bestCol}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric label="Nodes evaluated" value={result.nodesEvaluated} />
            <CountUp label="Nodes pruned" value={result.nodesPruned} accent />
            <Metric label="Evaluated states" value={result.evaluatedStates} />
            <Metric label="Recursive calls" value={result.recursiveCalls} />
            <Metric
              label="Branching factor"
              value={result.branchingFactor.toFixed(2)}
            />
            <Metric
              label="Effective b"
              value={result.effectiveBranchingFactor.toFixed(2)}
            />
            <Metric label="Cache hits" value={result.cacheHits} />
            <Metric
              label="Pruning efficiency"
              value={`${(
                (result.nodesPruned /
                  Math.max(1, result.nodesPruned + result.nodesEvaluated)) *
                100
              ).toFixed(1)}%`}
            />
            <Metric label="Time" value={`${result.timeMs.toFixed(0)} ms`} />
            <Metric label="Nodes/sec" value={compact(result.nodesPerSecond)} />
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Minimax vs alpha-beta comparison
            </div>
            <div className="panel rounded-xl p-3 grid gap-2 text-xs">
              <div className="grid grid-cols-[1fr_72px_72px] gap-2 text-muted-foreground">
                <span>Algorithm at depth {result.comparison.depth}</span>
                <span className="text-right">Nodes</span>
                <span className="text-right">Time</span>
              </div>
              <CompareRow
                name="Minimax only"
                nodes={result.comparison.minimaxNodes}
                time={result.comparison.minimaxTimeMs}
              />
              <CompareRow
                name="Minimax + αβ"
                nodes={result.comparison.alphaBetaNodes}
                time={result.comparison.alphaBetaTimeMs}
                good
              />
              <div className="mt-1 rounded-lg bg-[color-mix(in_oklab,var(--good)_10%,transparent)] px-2 py-1.5 text-[11px] text-muted-foreground">
                Alpha-beta removes{" "}
                {(result.comparison.nodeReduction * 100).toFixed(1)}% of
                explored nodes in the benchmark tree without changing the
                minimax decision.
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              AI thinking timeline
            </div>
            <div className="panel rounded-xl p-2 grid gap-1.5">
              {result.timeline.map((step) => (
                <TimelineRow
                  key={step.depth}
                  step={step}
                  active={step.depth === result.depthReached}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Why this move?
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              {result.reason}
            </p>
            <div className="mt-3 grid gap-1.5">
              {result.evaluation.items.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[1fr_58px] gap-2 rounded-lg border border-[color:var(--panel-border)] bg-card/35 px-2.5 py-2 text-xs"
                >
                  <div>
                    <div className="font-medium text-foreground/90">
                      {item.label}
                    </div>
                    <div className="text-[10px] leading-snug text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                  <div
                    className={`text-right font-display font-semibold tabular-nums ${item.value >= 0 ? "text-[color:var(--good)]" : "text-[color:var(--bad)]"}`}
                  >
                    {item.value > 0 ? "+" : ""}
                    {scoreText(item.value)}
                  </div>
                </div>
              ))}
              <div className="text-right text-xs font-semibold">
                Final heuristic = {scoreText(result.evaluation.total)}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Search tree
              <button
                type="button"
                onClick={onOpenTree}
                className="float-right inline-flex items-center gap-1 rounded-lg border border-[color:var(--panel-border)] px-2 py-1 text-[10px] normal-case tracking-normal text-foreground hover:border-foreground/30"
              >
                <Maximize2 className="h-3 w-3" /> Open Full AI Search Tree
              </button>
            </div>
            <div className="panel rounded-xl p-3 overflow-hidden">
              <SearchTree
                tree={result.tree}
                bestCol={result.bestCol}
                activeNodeId={currentStep?.nodeId}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <i
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ background: "var(--good)" }}
                />{" "}
                best path
              </span>
              <span className="flex items-center gap-1">
                <i
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ background: "var(--player2)" }}
                />{" "}
                active node
              </span>
              <span className="flex items-center gap-1">
                <i
                  className="w-2 h-2 rounded-full inline-block"
                  style={{
                    background:
                      "color-mix(in oklab, var(--bad) 60%, transparent)",
                  }}
                />{" "}
                pruned
              </span>
              <span>MIN nodes red-tinted</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Search playback
            </div>
            <div className="panel rounded-xl p-2.5 grid gap-2">
              <div className="flex items-center gap-2">
                <IconButton
                  label="Previous step"
                  onClick={() => setPlaybackIndex((i) => Math.max(0, i - 1))}
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton
                  label={autoPlay ? "Pause playback" : "Auto play search"}
                  onClick={() => setAutoPlay((v) => !v)}
                >
                  {autoPlay ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </IconButton>
                <IconButton
                  label="Reset playback"
                  onClick={() => {
                    setPlaybackIndex(0);
                    setAutoPlay(false);
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </IconButton>
                <button
                  type="button"
                  onClick={() => {
                    setPlaybackIndex(Math.max(0, result.playback.length - 1));
                    setAutoPlay(false);
                  }}
                  className="rounded-lg border border-[color:var(--panel-border)] px-2.5 py-2 text-[11px] hover:border-foreground/30 transition"
                >
                  Jump to End
                </button>
                <IconButton
                  label="Next step"
                  onClick={() =>
                    setPlaybackIndex((i) =>
                      Math.min((result.playback.length || 1) - 1, i + 1),
                    )
                  }
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </IconButton>
                <div className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                  {result.playback.length ? playbackIndex + 1 : 0}/
                  {result.playback.length}
                </div>
              </div>
              <div className="rounded-lg bg-card/40 border border-[color:var(--panel-border)] px-2.5 py-2 text-xs leading-relaxed">
                {currentStep ? (
                  <>
                    <div className="font-medium text-foreground/90">
                      {eventLabel(currentStep.event)}
                    </div>
                    <div className="text-muted-foreground">
                      {currentStep.label}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      alpha {boundText(currentStep.alpha)} | beta{" "}
                      {boundText(currentStep.beta)}
                    </div>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    Run an AI move to replay the search.
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {!result && !thinking && (
        <div className="text-xs text-muted-foreground">
          Make a move to see the AI's reasoning.
        </div>
      )}
    </aside>
  );
}

function IconButton({
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
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg border border-[color:var(--panel-border)] bg-card/50 hover:border-foreground/30 transition"
    >
      {children}
    </button>
  );
}

const eventLabel = (event: string) =>
  event === "prune"
    ? "Alpha-beta cutoff"
    : event === "evaluate"
      ? "Evaluation"
      : event === "best"
        ? "Backpropagation"
        : "Node expansion";

const boundText = (n?: number) => {
  if (n === undefined) return "?";
  if (n === Infinity) return "+inf";
  if (n === -Infinity) return "-inf";
  return n.toFixed(0);
};

const compact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : n.toFixed(0);

const scoreText = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return n > 0 ? "+inf" : "-inf";
  return n.toFixed(0);
};

function TimelineRow({
  step,
  active,
}: {
  step: SearchTimelineStep;
  active: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[44px_1fr_54px] items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${
        active
          ? "bg-[color-mix(in_oklab,var(--good)_10%,transparent)]"
          : "bg-card/30"
      }`}
    >
      <div className="font-display font-semibold">d{step.depth}</div>
      <div className="text-muted-foreground truncate">
        col {step.bestCol + 1} | {compact(step.nodesEvaluated)} nodes |{" "}
        {compact(step.cacheHits)} hits
      </div>
      <div className="text-right tabular-nums text-foreground/90">
        {scoreText(step.bestScore)}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[color:var(--panel-border)] bg-card/40 p-2.5">
      <div className="text-base font-display font-semibold tabular-nums">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function CompareRow({
  name,
  nodes,
  time,
  good,
}: {
  name: string;
  nodes: number;
  time: number;
  good?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[1fr_72px_72px] gap-2 rounded-lg px-2 py-1.5 ${good ? "bg-[color-mix(in_oklab,var(--good)_9%,transparent)]" : "bg-card/35"}`}
    >
      <div className="font-medium">{name}</div>
      <div className="text-right tabular-nums text-muted-foreground">
        {compact(nodes)}
      </div>
      <div className="text-right tabular-nums text-muted-foreground">
        {time.toFixed(0)}ms
      </div>
    </div>
  );
}

function CountUp({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const dur = 700;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(from + (value - from) * e));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className="rounded-xl border border-[color:var(--panel-border)] bg-card/40 p-2.5">
      <motion.div
        key={value}
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        className={`text-base font-display font-semibold tabular-nums ${accent ? "text-[color:var(--good)]" : ""}`}
      >
        {display.toLocaleString()}
      </motion.div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
