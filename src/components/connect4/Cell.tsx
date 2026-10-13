import { motion } from "framer-motion";
import { Cell as CellT } from "@/lib/connect4/types";

interface Props {
  value: CellT;
  row: number;
  col: number;
  cellSize: number;
  isWinning: boolean;
  justDropped: boolean;
}

export function Cell({ value, row, col, cellSize, isWinning, justDropped }: Props) {
  const inner =
    value === 0 ? null : (
      <motion.div
        key={`${row}-${col}-${value}`}
        initial={
          justDropped
            ? { y: -(cellSize * (row + 1) + 20) }
            : { y: 0 }
        }
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18, mass: 0.9 }}
        className={`absolute inset-1 rounded-full ${
          value === 1 ? "bg-radial-p1 glow-p1" : "bg-radial-p2 glow-p2"
        } ${isWinning ? "animate-win-pulse" : ""}`}
      />
    );

  return (
    <div
      role="gridcell"
      aria-label={`row ${row + 1} column ${col + 1}, ${
        value === 0 ? "empty" : value === 1 ? "red" : "yellow"
      }`}
      className="relative rounded-full"
      style={{
        width: cellSize,
        height: cellSize,
        background: "var(--board-cell)",
        boxShadow: "inset 0 0 0 2px var(--board-border), inset 0 4px 10px rgba(0,0,0,0.45)",
      }}
    >
      {inner}
    </div>
  );
}
