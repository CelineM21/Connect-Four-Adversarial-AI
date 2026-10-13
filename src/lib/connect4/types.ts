export type Cell = 0 | 1 | 2; // 0 empty, 1 player(red), 2 AI(yellow)
export type Board = Cell[][]; // 6 rows x 7 cols, row 0 = top
export type Player = 1 | 2;

export const ROWS = 6;
export const COLS = 7;

export interface MoveAIMetrics {
  nodesEvaluated: number;
  nodesPruned: number;
  cacheHits: number;
  timeMs: number;
  top3: { col: number; score: number }[];
  bestScore: number;
}

export interface Move {
  index: number; // move number, 1-based
  player: Player;
  col: number;
  row: number;
  ai?: MoveAIMetrics;
}

export interface TreeNode {
  id?: number;
  col: number; // column played to reach this node from parent (-1 for root)
  score: number;
  pruned?: boolean;
  alpha?: number;
  beta?: number;
  depth?: number;
  heuristic?: number;
  playerRole?: "MAX" | "MIN";
  nodeType?: "max" | "min" | "leaf" | "cutoff";
  children?: TreeNode[];
}

export interface EvaluationBreakdownItem {
  label: string;
  value: number;
  description: string;
}

export interface EvaluationBreakdown {
  total: number;
  items: EvaluationBreakdownItem[];
}

export interface SearchComparison {
  depth: number;
  minimaxNodes: number;
  alphaBetaNodes: number;
  minimaxTimeMs: number;
  alphaBetaTimeMs: number;
  alphaBetaPruned: number;
  nodeReduction: number;
  runtimeReduction: number;
}

export interface AIOptions {
  useAlphaBeta: boolean;
  useTranspositionTable: boolean;
  useMoveOrdering: boolean;
}

export interface SearchTimelineStep {
  depth: number;
  bestCol: number;
  bestScore: number;
  nodesEvaluated: number;
  nodesPruned: number;
  cacheHits: number;
  timeMs: number;
}

export interface SearchPlaybackStep {
  id: number;
  nodeId: number;
  event: "explore" | "evaluate" | "prune" | "best" | "return";
  label: string;
  depth?: number;
  bestCol?: number;
  bestScore?: number;
  alpha?: number;
  beta?: number;
  score?: number;
}

export interface AIResult {
  bestCol: number;
  bestScore: number;
  perColumn: (number | null)[]; // length 7, null if illegal
  top3: { col: number; score: number }[];
  nodesEvaluated: number;
  nodesPruned: number;
  cacheHits: number;
  timeMs: number;
  depthReached: number;
  branchingFactor: number;
  effectiveBranchingFactor: number;
  recursiveCalls: number;
  evaluatedStates: number;
  nodesPerSecond: number;
  timeline: SearchTimelineStep[];
  playback: SearchPlaybackStep[];
  options: AIOptions;
  tree: TreeNode;
  reason: string;
  evaluation: EvaluationBreakdown;
  comparison: SearchComparison;
}

export const DEFAULT_AI_OPTIONS: AIOptions = {
  useAlphaBeta: true,
  useTranspositionTable: true,
  useMoveOrdering: true,
};

export type Difficulty = "easy" | "medium" | "hard" | "expert";
export const DIFFICULTY_DEPTH: Record<Difficulty, number> = {
  easy: 2,
  medium: 4,
  hard: 6,
  expert: 8,
};
