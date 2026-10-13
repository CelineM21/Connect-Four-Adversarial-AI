import { motion } from "framer-motion";
import { COLS } from "@/lib/connect4/types";

interface Props {
  perColumn: (number | null)[];
  bestCol: number;
}

export function ScoreBars({ perColumn, bestCol }: Props) {
  const valid = perColumn.filter((v): v is number => v !== null);
  const max = Math.max(1, ...valid.map((v) => Math.abs(v)));
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
      {Array.from({ length: COLS }).map((_, c) => {
        const v = perColumn[c];
        const ratio = v === null ? 0 : v / max; // -1..1
        const height = v === null ? 4 : Math.max(6, Math.abs(ratio) * 80);
        const positive = (v ?? 0) >= 0;
        const isBest = c === bestCol;
        return (
          <div key={c} className="flex flex-col items-center gap-1">
            <div className="h-[88px] w-full flex items-end justify-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full rounded-md"
                style={{
                  background: v === null
                    ? "var(--muted)"
                    : positive
                      ? "color-mix(in oklab, var(--good) 80%, transparent)"
                      : "color-mix(in oklab, var(--bad) 80%, transparent)",
                  boxShadow: isBest ? "0 0 14px color-mix(in oklab, var(--good) 70%, transparent)" : undefined,
                  outline: isBest ? "1px solid color-mix(in oklab, var(--good) 80%, transparent)" : undefined,
                }}
              />
            </div>
            <div className={`text-[10px] tabular-nums ${isBest ? "text-[color:var(--good)] font-semibold" : "text-muted-foreground"}`}>
              {c + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
