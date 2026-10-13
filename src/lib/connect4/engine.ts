import { Board, Cell, COLS, Player, ROWS } from "./types";
import type { EvaluationBreakdown } from "./types";

export const createBoard = (): Board =>
  Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));

export const cloneBoard = (b: Board): Board => b.map((r) => r.slice());

export const legalCols = (b: Board): number[] => {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) if (b[0][c] === 0) cols.push(c);
  return cols;
};

export const isLegal = (b: Board, c: number) =>
  c >= 0 && c < COLS && b[0][c] === 0;

/** Drop and return the row landed in, or -1 if illegal. Mutates board. */
export const drop = (b: Board, c: number, p: Player): number => {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (b[r][c] === 0) {
      b[r][c] = p;
      return r;
    }
  }
  return -1;
};

export const undrop = (b: Board, c: number, r: number) => {
  b[r][c] = 0;
};

export const isFull = (b: Board) => legalCols(b).length === 0;

const DIRS: [number, number][] = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diag down-right
  [1, -1], // diag down-left
];

/** Returns winning 4 cells [[r,c]...] or null. */
export const findWin = (b: Board, p: Player): [number, number][] | null => {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (b[r][c] !== p) continue;
      for (const [dr, dc] of DIRS) {
        const cells: [number, number][] = [[r, c]];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          if (b[nr][nc] !== p) break;
          cells.push([nr, nc]);
        }
        if (cells.length === 4) return cells;
      }
    }
  }
  return null;
};

const opp = (p: Player): Player => (p === 1 ? 2 : 1);

const scoreWindow = (window: Cell[], me: Player): number => {
  const them = opp(me);
  let mine = 0,
    theirs = 0,
    empty = 0;
  for (const v of window) {
    if (v === me) mine++;
    else if (v === them) theirs++;
    else empty++;
  }
  if (mine === 4) return 1_000_000;
  if (theirs === 4) return -1_000_000;
  if (mine === 3 && empty === 1) return 100;
  if (theirs === 3 && empty === 1) return -120; // weight blocks slightly higher
  if (mine === 2 && empty === 2) return 10;
  if (theirs === 2 && empty === 2) return -10;
  return 0;
};

const addWindowToBreakdown = (
  window: Cell[],
  me: Player,
  totals: Record<string, number>,
) => {
  const them = opp(me);
  let mine = 0,
    theirs = 0,
    empty = 0;
  for (const v of window) {
    if (v === me) mine++;
    else if (v === them) theirs++;
    else empty++;
  }
  if (mine === 4) totals.immediateWin += 1_000_000;
  else if (theirs === 4) totals.dangerPrevention -= 1_000_000;
  else if (mine === 3 && empty === 1) totals.connect3 += 100;
  else if (theirs === 3 && empty === 1) totals.blockingOpponent -= 120;
  else if (mine === 2 && empty === 2) totals.connect2 += 10;
  else if (theirs === 2 && empty === 2) totals.dangerPrevention -= 10;
};

/** Heuristic from `me`'s perspective. */
export const evaluate = (b: Board, me: Player): number => {
  let score = 0;
  // center column control
  const centerCol = Math.floor(COLS / 2);
  for (let r = 0; r < ROWS; r++) {
    if (b[r][centerCol] === me) score += 3;
    else if (b[r][centerCol] !== 0) score -= 3;
  }
  // all 4-windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of DIRS) {
        const er = r + dr * 3;
        const ec = c + dc * 3;
        if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
        const w: Cell[] = [
          b[r][c],
          b[r + dr][c + dc],
          b[r + dr * 2][c + dc * 2],
          b[er][ec],
        ];
        score += scoreWindow(w, me);
      }
    }
  }
  return score;
};

/** Detailed heuristic decomposition from `me`'s perspective for explainable AI panels. */
export const evaluateBreakdown = (
  b: Board,
  me: Player,
): EvaluationBreakdown => {
  const totals = {
    center: 0,
    connect2: 0,
    connect3: 0,
    blockingOpponent: 0,
    immediateWin: 0,
    dangerPrevention: 0,
  };

  const centerCol = Math.floor(COLS / 2);
  for (let r = 0; r < ROWS; r++) {
    if (b[r][centerCol] === me) totals.center += 3;
    else if (b[r][centerCol] !== 0) totals.center -= 3;
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of DIRS) {
        const er = r + dr * 3;
        const ec = c + dc * 3;
        if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
        addWindowToBreakdown(
          [b[r][c], b[r + dr][c + dc], b[r + dr * 2][c + dc * 2], b[er][ec]],
          me,
          totals,
        );
      }
    }
  }

  const items = [
    {
      label: "Center control",
      value: totals.center,
      description:
        "Rewards occupying the center column because it participates in the most four-in-a-row windows.",
    },
    {
      label: "Connect-2 opportunities",
      value: totals.connect2,
      description:
        "Counts two-disc windows with two empty cells as low-risk future utility.",
    },
    {
      label: "Connect-3 opportunities",
      value: totals.connect3,
      description:
        "Rewards three-disc windows that threaten an immediate terminal state.",
    },
    {
      label: "Blocking opponent",
      value: totals.blockingOpponent,
      description:
        "Penalizes opponent three-in-a-row windows that require defensive play.",
    },
    {
      label: "Immediate win",
      value: totals.immediateWin,
      description:
        "Assigns terminal-level utility when MAX has four connected discs.",
    },
    {
      label: "Danger prevention",
      value: totals.dangerPrevention,
      description:
        "Penalizes opponent threats so minimax prefers safer successor states.",
    },
  ];

  return { total: items.reduce((sum, item) => sum + item.value, 0), items };
};
