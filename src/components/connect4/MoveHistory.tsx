import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Move } from "@/lib/connect4/types";

export function MoveHistory({ history }: { history: Move[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        Move history
      </div>
      <div
        className="panel rounded-xl p-2 flex-1 overflow-y-auto scroll-thin"
        role="log"
        aria-live="polite"
        aria-label="Move history"
      >
        {history.length === 0 ? (
          <div className="text-xs text-muted-foreground p-3">No moves yet.</div>
        ) : (
          <ul className="space-y-1">
            {history.map((m) => {
              const expandable = !!m.ai;
              const isOpen = open === m.index;
              return (
                <motion.li
                  key={m.index}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-md hover:bg-accent/40"
                >
                  <button
                    type="button"
                    onClick={() =>
                      expandable && setOpen(isOpen ? null : m.index)
                    }
                    aria-expanded={expandable ? isOpen : undefined}
                    aria-label={`Move ${m.index}, ${
                      m.player === 1 ? "you" : "AI"
                    } played column ${m.col + 1}${
                      expandable ? ". Toggle AI metrics." : ""
                    }`}
                    className={`w-full flex items-center gap-2 text-sm px-2 py-1.5 rounded-md text-left ${
                      expandable ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span className="text-muted-foreground tabular-nums w-10">
                      #{m.index}
                    </span>
                    <span
                      aria-hidden
                      className={`h-2.5 w-2.5 rounded-full ${
                        m.player === 1
                          ? "bg-radial-p1 glow-p1"
                          : "bg-radial-p2 glow-p2"
                      }`}
                    />
                    <span className="text-foreground/90 flex-1">
                      {m.player === 1 ? "You" : "AI"} {"->"} Col {m.col + 1}
                    </span>
                    {expandable && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {expandable && isOpen && m.ai && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-2.5 pt-1 text-[11px] grid gap-1">
                          <div className="grid grid-cols-2 gap-1.5">
                            <Mini
                              label="Nodes"
                              value={m.ai.nodesEvaluated.toLocaleString()}
                            />
                            <Mini
                              label="Pruned"
                              value={m.ai.nodesPruned.toLocaleString()}
                              accent
                            />
                            <Mini
                              label="Cache"
                              value={m.ai.cacheHits.toLocaleString()}
                            />
                            <Mini
                              label="Time"
                              value={`${m.ai.timeMs.toFixed(0)} ms`}
                            />
                            <Mini
                              label="Score"
                              value={m.ai.bestScore.toFixed(0)}
                            />
                          </div>
                          <div className="text-muted-foreground mt-0.5">
                            Top columns:{" "}
                            <span className="text-foreground/90 tabular-nums">
                              {m.ai.top3
                                .map(
                                  (t) =>
                                    `${t.col + 1} (${t.score.toFixed(0)})`,
                                )
                                .join(" | ")}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-[color:var(--panel-border)] bg-card/40 px-2 py-1">
      <div
        className={`text-[12px] font-display font-semibold tabular-nums ${
          accent ? "text-[color:var(--good)]" : ""
        }`}
      >
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
