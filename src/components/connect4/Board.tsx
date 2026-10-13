import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cell } from "./Cell";
import { Board, COLS, Player, ROWS } from "@/lib/connect4/types";
import { isLegal } from "@/lib/connect4/engine";

interface Props {
  board: Board;
  current: Player;
  winningCells: [number, number][];
  lastDropped: { row: number; col: number } | null;
  disabled: boolean;
  onDrop: (col: number) => void;
}

const CELL = 72;
const GAP = 10;

export function Board4({
  board,
  current,
  winningCells,
  lastDropped,
  disabled,
  onDrop,
}: Props) {
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [focusCol, setFocusCol] = useState<number>(3);

  // Scale to viewport
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const compute = () => {
      const ideal = COLS * CELL + (COLS + 1) * GAP;
      const w = Math.min(window.innerWidth - 32, 720);
      const h = window.innerHeight - 240;
      const sW = w / ideal;
      const sH = h / (ROWS * CELL + (ROWS + 1) * GAP);
      setScale(Math.min(1, sW, sH));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const winSet = useMemo(
    () => new Set(winningCells.map(([r, c]) => `${r},${c}`)),
    [winningCells],
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setFocusCol((c) => Math.max(0, c - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setFocusCol((c) => Math.min(COLS - 1, c + 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isLegal(board, focusCol)) onDrop(focusCol);
    }
  };

  const activeCol = hoverCol ?? focusCol;
  const previewRow = -1;
  const showPreview = !disabled && current === 1 && activeCol !== null && isLegal(board, activeCol);

  return (
    <div
      className="select-none outline-none"
      style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      tabIndex={0}
      role="grid"
      aria-label="Connect Four board"
      onKeyDown={handleKey}
    >
      {/* Floating preview */}
      <div
        className="relative mx-auto"
        style={{
          width: COLS * CELL + (COLS + 1) * GAP,
          height: CELL,
        }}
      >
        <AnimatePresence>
          {showPreview && (
            <motion.div
              key={activeCol}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`absolute rounded-full ${
                current === 1 ? "bg-radial-p1 glow-p1" : "bg-radial-p2 glow-p2"
              }`}
              style={{
                width: CELL - 8,
                height: CELL - 8,
                top: 8,
                left: GAP + activeCol * (CELL + GAP) + 4,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Board */}
      <div
        className="relative mx-auto rounded-3xl"
        style={{
          width: COLS * CELL + (COLS + 1) * GAP,
          padding: GAP,
          background: "linear-gradient(180deg, var(--board) 0%, color-mix(in oklab, var(--board) 80%, black 20%) 100%)",
          border: "1px solid var(--board-border)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Column hover overlays */}
        <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: COLS }).map((_, c) => (
            <div
              key={c}
              className={`transition-opacity duration-150 ${
                activeCol === c && showPreview ? "opacity-100" : "opacity-0"
              }`}
              style={{
                background: `linear-gradient(180deg, color-mix(in oklab, var(--player${current}) 14%, transparent) 0%, transparent 100%)`,
              }}
            />
          ))}
        </div>

        {/* Cells */}
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
            gridAutoRows: `${CELL}px`,
            gap: GAP,
          }}
        >
          {board.map((row, r) =>
            row.map((v, c) => (
              <Cell
                key={`${r}-${c}`}
                value={v}
                row={r}
                col={c}
                cellSize={CELL}
                isWinning={winSet.has(`${r},${c}`)}
                justDropped={!!lastDropped && lastDropped.row === r && lastDropped.col === c}
              />
            )),
          )}
        </div>

        {/* Click columns */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, padding: GAP }}>
          {Array.from({ length: COLS }).map((_, c) => (
            <button
              key={c}
              type="button"
              aria-label={`Drop in column ${c + 1}`}
              disabled={disabled || !isLegal(board, c)}
              onMouseEnter={() => setHoverCol(c)}
              onMouseLeave={() => setHoverCol(null)}
              onFocus={() => setFocusCol(c)}
              onClick={() => onDrop(c)}
              className="cursor-pointer disabled:cursor-not-allowed"
              style={{ background: "transparent" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
