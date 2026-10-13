import { AIOptions, Difficulty, Move } from "@/lib/connect4/types";
import { MoveHistory } from "./MoveHistory";
import { Switch } from "@/components/ui/switch";

const DIFFS: { key: Difficulty; label: string; depth: number }[] = [
  { key: "easy", label: "Easy", depth: 2 },
  { key: "medium", label: "Medium", depth: 4 },
  { key: "hard", label: "Hard", depth: 6 },
  { key: "expert", label: "Expert", depth: 8 },
];

interface Props {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  scores: { player: number; ai: number; draws: number };
  history: Move[];
  showThinking: boolean;
  setShowThinking: (v: boolean) => void;
  aiOptions: AIOptions;
  setAIOptions: (v: AIOptions) => void;
  onNewGame: () => void;
}

export function LeftPanel({
  difficulty,
  setDifficulty,
  scores,
  history,
  showThinking,
  setShowThinking,
  aiOptions,
  setAIOptions,
  onNewGame,
}: Props) {
  const setOption = (key: keyof AIOptions, value: boolean) =>
    setAIOptions({ ...aiOptions, [key]: value });

  return (
    <aside className="panel rounded-2xl p-4 flex flex-col gap-5 h-full min-h-0">
      <div>
        <div className="font-display text-lg font-semibold">
          AI Decision Lab
        </div>
        <div className="text-xs text-muted-foreground">
          Minimax | Alpha-Beta | Heuristics
        </div>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Difficulty
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DIFFS.map((d) => {
            const active = d.key === difficulty;
            return (
              <button
                key={d.key}
                onClick={() => setDifficulty(d.key)}
                className={`text-left rounded-xl px-3 py-2.5 transition-all border ${
                  active
                    ? "border-[color:var(--player1)] bg-[color-mix(in_oklab,var(--player1)_12%,transparent)] glow-p1"
                    : "border-[color:var(--panel-border)] hover:border-foreground/30 bg-card/40"
                }`}
              >
                <div className="text-sm font-semibold">{d.label}</div>
                <div className="text-[11px] text-muted-foreground">
                  Depth {d.depth} · ≈{Math.pow(7, d.depth).toLocaleString()}{" "}
                  states
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onNewGame}
        className="w-full rounded-xl py-3 font-display font-semibold text-sm tracking-wide
                   bg-gradient-to-r from-[color:var(--player1)] to-[color:var(--player2)]
                   text-black hover:brightness-110 transition glow-p1"
      >
        New Game
      </button>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Score
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="You" value={scores.player} accent="p1" />
          <Stat label="AI" value={scores.ai} accent="p2" />
          <Stat label="Draws" value={scores.draws} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Show AI thinking</div>
          <div className="text-[11px] text-muted-foreground">
            Live search visualization
          </div>
        </div>
        <Switch checked={showThinking} onCheckedChange={setShowThinking} />
      </div>

      <div className="grid gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Algorithm selection
          </div>
          <div className="text-[11px] text-muted-foreground">
            Choose whether recursive minimax explores the full tree or uses
            alpha-beta bounds to prune impossible alternatives.
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOption("useAlphaBeta", false)}
            className={`rounded-xl border px-3 py-2 text-left text-xs transition ${!aiOptions.useAlphaBeta ? "border-[color:var(--player2)] bg-[color-mix(in_oklab,var(--player2)_12%,transparent)]" : "border-[color:var(--panel-border)] bg-card/40 hover:border-foreground/30"}`}
          >
            <div className="font-semibold">Minimax</div>
            <div className="text-[10px] text-muted-foreground">
              Full expansion
            </div>
          </button>
          <button
            type="button"
            onClick={() => setOption("useAlphaBeta", true)}
            className={`rounded-xl border px-3 py-2 text-left text-xs transition ${aiOptions.useAlphaBeta ? "border-[color:var(--good)] bg-[color-mix(in_oklab,var(--good)_12%,transparent)]" : "border-[color:var(--panel-border)] bg-card/40 hover:border-foreground/30"}`}
          >
            <div className="font-semibold">Minimax + αβ</div>
            <div className="text-[10px] text-muted-foreground">
              Bounded pruning
            </div>
          </button>
        </div>
        <OptionSwitch
          label="Alpha-beta pruning"
          note="Removes branches that cannot change the final minimax decision."
          checked={aiOptions.useAlphaBeta}
          onChange={(v) => setOption("useAlphaBeta", v)}
        />
        <OptionSwitch
          label="Transposition table"
          note="Reuses previously evaluated board states."
          checked={aiOptions.useTranspositionTable}
          onChange={(v) => setOption("useTranspositionTable", v)}
        />
        <OptionSwitch
          label="Center-first move ordering"
          note="Searches stronger columns earlier to improve pruning."
          checked={aiOptions.useMoveOrdering}
          onChange={(v) => setOption("useMoveOrdering", v)}
        />
      </div>

      <MoveHistory history={history} />
    </aside>
  );
}

function OptionSwitch({
  label,
  note,
  checked,
  onChange,
}: {
  label: string;
  note: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--panel-border)] bg-card/40 p-2.5">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[10px] leading-snug text-muted-foreground">
          {note}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "p1" | "p2";
}) {
  return (
    <div className="rounded-xl border border-[color:var(--panel-border)] bg-card/50 p-2.5 text-center">
      <div
        className={`text-xl font-display font-semibold tabular-nums ${
          accent === "p1"
            ? "text-[color:var(--player1)] text-glow-p1"
            : accent === "p2"
              ? "text-[color:var(--player2)] text-glow-p2"
              : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
