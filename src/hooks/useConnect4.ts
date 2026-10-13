import { useCallback, useEffect, useRef, useState } from "react";
import { runAI } from "@/lib/connect4/ai";
import {
  cloneBoard,
  createBoard,
  drop as dropDisc,
  findWin,
  isFull,
  isLegal,
} from "@/lib/connect4/engine";
import { playDraw, playDrop, playWin } from "@/lib/connect4/sound";
import {
  AIResult,
  AIOptions,
  Board,
  DEFAULT_AI_OPTIONS,
  Difficulty,
  DIFFICULTY_DEPTH,
  Move,
  Player,
} from "@/lib/connect4/types";

type Status = "idle" | "thinking" | "won" | "draw";

interface Scores {
  player: number;
  ai: number;
  draws: number;
}

const SCORES_KEY = "connect4.scores.v1";
const loadScores = (): Scores => {
  if (typeof window === "undefined") return { player: 0, ai: 0, draws: 0 };
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { player: 0, ai: 0, draws: 0 };
};

export const useConnect4 = () => {
  const [board, setBoard] = useState<Board>(createBoard);
  const [current, setCurrent] = useState<Player>(1);
  const [status, setStatus] = useState<Status>("idle");
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [history, setHistory] = useState<Move[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [scores, setScores] = useState<Scores>({ player: 0, ai: 0, draws: 0 });
  const [lastAI, setLastAI] = useState<AIResult | null>(null);
  const [showThinking, setShowThinking] = useState(true);
  const [aiOptions, setAIOptions] = useState<AIOptions>(DEFAULT_AI_OPTIONS);
  const scoreCommitted = useRef(false);

  useEffect(() => setScores(loadScores()), []);
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  }, [scores]);

  const reset = useCallback(() => {
    setBoard(createBoard());
    setCurrent(1);
    setStatus("idle");
    setWinner(null);
    setWinningCells([]);
    setHistory([]);
    setLastAI(null);
    scoreCommitted.current = false;
  }, []);

  const finalize = useCallback(
    (b: Board, mover: Player) => {
      const win = findWin(b, mover);
      if (win) {
        setWinningCells(win);
        setWinner(mover);
        setStatus("won");
        playWin();
        if (!scoreCommitted.current) {
          scoreCommitted.current = true;
          setScores((s) =>
            mover === 1
              ? { ...s, player: s.player + 1 }
              : { ...s, ai: s.ai + 1 },
          );
        }
        return true;
      }
      if (isFull(b)) {
        setStatus("draw");
        playDraw();
        if (!scoreCommitted.current) {
          scoreCommitted.current = true;
          setScores((s) => ({ ...s, draws: s.draws + 1 }));
        }
        return true;
      }
      return false;
    },
    [],
  );

  const playerDrop = useCallback(
    (col: number) => {
      if (status !== "idle" || current !== 1 || !isLegal(board, col)) return;
      const b = cloneBoard(board);
      const r = dropDisc(b, col, 1);
      if (r < 0) return;
      const move: Move = { index: history.length + 1, player: 1, col, row: r };
      playDrop();
      setBoard(b);
      setHistory((h) => [...h, move]);
      if (finalize(b, 1)) return;
      setCurrent(2);
      setStatus("thinking");
    },
    [board, current, status, history, finalize],
  );

  // AI turn
  useEffect(() => {
    if (status !== "thinking" || current !== 2) return;
    const depth = DIFFICULTY_DEPTH[difficulty];
    const start = performance.now();
    const t = setTimeout(() => {
      const result = runAI(cloneBoard(board), 2, depth, aiOptions);
      const elapsed = performance.now() - start;
      const minDelay = depth >= 6 ? 350 : 250;
      const wait = Math.max(0, minDelay - elapsed);
      setTimeout(() => {
        const b = cloneBoard(board);
        const r = dropDisc(b, result.bestCol, 2);
        const move: Move = {
          index: history.length + 1,
          player: 2,
          col: result.bestCol,
          row: r,
          ai: {
            nodesEvaluated: result.nodesEvaluated,
            nodesPruned: result.nodesPruned,
            cacheHits: result.cacheHits,
            timeMs: result.timeMs,
            top3: result.top3,
            bestScore: result.bestScore,
          },
        };
        playDrop();
        setLastAI(result);
        setBoard(b);
        setHistory((h) => [...h, move]);
        if (finalize(b, 2)) return;
        setCurrent(1);
        setStatus("idle");
      }, wait);
    }, 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, current]);

  return {
    board,
    current,
    status,
    winner,
    winningCells,
    history,
    difficulty,
    setDifficulty,
    scores,
    lastAI,
    showThinking,
    setShowThinking,
    aiOptions,
    setAIOptions,
    playerDrop,
    reset,
  };
};
