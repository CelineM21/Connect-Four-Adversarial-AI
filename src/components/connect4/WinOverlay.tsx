import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Player } from "@/lib/connect4/types";

interface Props {
  status: "won" | "draw";
  winner: Player | null;
  onReplay: () => void;
}

export function WinOverlay({ status, winner, onReplay }: Props) {
  const replayRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (status !== "won") return;
    const colors = winner === 1 ? ["#FF3B3B", "#ff7777"] : ["#FFD600", "#ffe46b"];
    const fire = (x: number) =>
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x, y: 0.4 },
        colors,
      });
    fire(0.2);
    fire(0.5);
    fire(0.8);
    const t = setTimeout(() => fire(0.5), 350);
    return () => clearTimeout(t);
  }, [status, winner]);

  // Focus management: focus replay on mount, restore previous focus on unmount,
  // and trap Escape/Enter to trigger replay.
  useEffect(() => {
    previousFocus.current = (document.activeElement as HTMLElement) ?? null;
    const id = window.setTimeout(() => replayRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        onReplay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      previousFocus.current?.focus?.();
    };
  }, [onReplay]);

  const title =
    status === "draw"
      ? "Draw"
      : winner === 1
        ? "You Win!"
        : "AI Wins";
  const sub =
    status === "draw"
      ? "The board is full."
      : winner === 1
        ? "Brilliant play."
        : "The minimax got you this round.";

  const titleId = "win-overlay-title";
  const descId = "win-overlay-desc";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/55"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <motion.div
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="panel rounded-3xl px-10 py-8 text-center max-w-md mx-4"
      >
        <div
          id={titleId}
          className={`font-display text-5xl font-bold mb-2 ${
            status === "draw"
              ? ""
              : winner === 1
                ? "text-[color:var(--player1)] text-glow-p1"
                : "text-[color:var(--player2)] text-glow-p2"
          }`}
        >
          {title}
        </div>
        <p id={descId} className="text-muted-foreground mb-6">{sub}</p>
        <button
          ref={replayRef}
          onClick={onReplay}
          className="rounded-xl px-6 py-3 font-display font-semibold bg-gradient-to-r from-[color:var(--player1)] to-[color:var(--player2)] text-black hover:brightness-110 transition glow-p1 focus:outline-none focus:ring-2 focus:ring-[color:var(--player1)] focus:ring-offset-2 focus:ring-offset-background"
        >
          Play again
        </button>
      </motion.div>
    </motion.div>
  );
}
