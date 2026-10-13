import { useMemo, useState } from "react";
import { Brain, Menu } from "lucide-react";
import { useConnect4 } from "@/hooks/useConnect4";
import { Board4 } from "./Board";
import { FullSearchTreeViewer } from "./FullSearchTreeViewer";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { WinOverlay } from "./WinOverlay";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Game() {
  const g = useConnect4();
  const [rightOpen, setRightOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const lastDropped = useMemo(() => {
    const last = g.history[g.history.length - 1];
    if (!last) return null;
    return { row: last.row, col: last.col };
  }, [g.history]);

  const turnLabel =
    g.status === "thinking"
      ? "AI's turn"
      : g.status === "won"
        ? g.winner === 1
          ? "You won"
          : "AI won"
        : g.status === "draw"
          ? "Draw"
          : "Your turn";

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-[1640px] px-4 py-4 lg:py-6">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between mb-3">
          <Sheet>
            <SheetTrigger
              aria-label="Open game settings and history"
              className="rounded-lg border border-[color:var(--panel-border)] p-2"
            >
              <Menu className="w-5 h-5" aria-hidden />
            </SheetTrigger>
            <SheetContent
              side="left"
              aria-label="Game settings, score and move history"
              className="bg-background border-[color:var(--panel-border)] p-3 w-[300px]"
            >
              <LeftPanel
                difficulty={g.difficulty}
                setDifficulty={g.setDifficulty}
                scores={g.scores}
                history={g.history}
                showThinking={g.showThinking}
                setShowThinking={g.setShowThinking}
                aiOptions={g.aiOptions}
                setAIOptions={g.setAIOptions}
                onNewGame={g.reset}
              />
            </SheetContent>
          </Sheet>
          <div className="font-display text-lg font-semibold">
            Adversarial AI System
          </div>
          <Sheet open={rightOpen} onOpenChange={setRightOpen}>
            <SheetTrigger
              aria-label="Open AI thinking panel"
              className="rounded-lg border border-[color:var(--panel-border)] p-2"
            >
              <Brain className="w-5 h-5" aria-hidden />
            </SheetTrigger>
            <SheetContent
              side="right"
              aria-label="AI search visualization"
              className="bg-background border-[color:var(--panel-border)] p-3 w-[min(96vw,520px)]"
            >
              <RightPanel
                thinking={g.status === "thinking"}
                result={g.lastAI}
                enabled={g.showThinking}
                onOpenTree={() => setTreeOpen(true)}
                demoMode={demoMode}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div
          className="grid gap-4 lg:gap-6 lg:grid-cols-[280px_minmax(420px,1fr)_460px]"
          style={{ minHeight: "calc(100vh - 56px)" }}
        >
          <div className="hidden lg:block">
            <LeftPanel
              difficulty={g.difficulty}
              setDifficulty={g.setDifficulty}
              scores={g.scores}
              history={g.history}
              showThinking={g.showThinking}
              setShowThinking={g.setShowThinking}
              aiOptions={g.aiOptions}
              setAIOptions={g.setAIOptions}
              onNewGame={g.reset}
            />
          </div>

          <main className="flex flex-col items-center justify-start gap-4 pt-2">
            <section className="w-full rounded-2xl border border-[color:var(--panel-border)] bg-card/35 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-2xl font-semibold tracking-tight">
                    Connect4 Adversarial Search Laboratory
                  </div>
                  <div className="text-xs text-muted-foreground">
                    CSC474 minimax, recursive state-space exploration, utility
                    functions, and alpha-beta optimization.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDemoMode((v) => !v)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${demoMode ? "border-[color:var(--player2)] bg-[color-mix(in_oklab,var(--player2)_14%,transparent)] text-[color:var(--player2)]" : "border-[color:var(--panel-border)] bg-card/50 hover:border-foreground/30"}`}
                >
                  {demoMode
                    ? "Presentation Mode On"
                    : "Demo / Presentation Mode"}
                </button>
                <button
                  type="button"
                  onClick={() => setTreeOpen(true)}
                  className="rounded-xl border border-[color:var(--panel-border)] bg-card/50 px-3 py-2 text-xs font-semibold hover:border-foreground/30"
                >
                  Open Full AI Search Tree
                </button>
              </div>
            </section>
            <div
              className="flex items-center gap-3"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div
                aria-hidden
                className={`h-3 w-3 rounded-full ${
                  g.current === 1
                    ? "bg-radial-p1 glow-p1"
                    : "bg-radial-p2 glow-p2"
                }`}
              />
              <div className="font-display text-lg font-medium">
                {turnLabel}
              </div>
            </div>
            <Board4
              board={g.board}
              current={g.current}
              winningCells={g.winningCells}
              lastDropped={lastDropped}
              disabled={g.status !== "idle"}
              onDrop={g.playerDrop}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Click a column or use Left/Right and Enter
            </p>
          </main>

          <div className="hidden lg:block">
            <RightPanel
              thinking={g.status === "thinking"}
              result={g.lastAI}
              enabled={g.showThinking}
              onOpenTree={() => setTreeOpen(true)}
              demoMode={demoMode}
            />
          </div>
        </div>
      </div>

      {(g.status === "won" || g.status === "draw") && (
        <WinOverlay status={g.status} winner={g.winner} onReplay={g.reset} />
      )}
      {treeOpen && (
        <FullSearchTreeViewer
          result={g.lastAI}
          onClose={() => setTreeOpen(false)}
        />
      )}
    </div>
  );
}
