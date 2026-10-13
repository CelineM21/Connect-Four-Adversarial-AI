import {
  cloneBoard,
  drop,
  evaluate,
  evaluateBreakdown,
  findWin,
  isFull,
  legalCols,
  undrop,
} from "./engine";
import {
  AIResult,
  AIOptions,
  Board,
  COLS,
  DEFAULT_AI_OPTIONS,
  EvaluationBreakdown,
  Player,
  SearchPlaybackStep,
  SearchTimelineStep,
  TreeNode,
} from "./types";

const ORDER = [3, 2, 4, 1, 5, 0, 6];

interface Ctx {
  me: Player;
  nodesEvaluated: number;
  nodesPruned: number;
  cacheHits: number;
  table: Map<string, number>;
  options: AIOptions;
  nextNodeId: number;
  playback: SearchPlaybackStep[];
}

const opponent = (p: Player): Player => (p === 1 ? 2 : 1);

const naturalLegal = (b: Board) =>
  Array.from({ length: COLS }, (_, c) => c).filter((c) => b[0][c] === 0);

const orderedLegal = (b: Board, options: AIOptions) =>
  (options.useMoveOrdering ? ORDER : naturalLegal(b)).filter(
    (c) => b[0][c] === 0,
  );

const serialize = (b: Board, depth: number, maximizing: boolean, me: Player) =>
  `${me}|${depth}|${maximizing ? 1 : 0}|${b.map((r) => r.join("")).join("")}`;

const formatScore = (score: number) => {
  if (!Number.isFinite(score)) return score > 0 ? "+infinity" : "-infinity";
  if (Math.abs(score) >= 1_000_000) {
    return score > 0 ? "+infinity" : "-infinity";
  }
  return score.toFixed(0);
};

const pushStep = (
  ctx: Ctx,
  node: TreeNode | null,
  event: SearchPlaybackStep["event"],
  label: string,
  score?: number,
  bestCol?: number,
) => {
  if (!node?.id) return;
  ctx.playback.push({
    id: ctx.playback.length + 1,
    nodeId: node.id,
    event,
    label,
    depth: node.depth,
    bestCol,
    bestScore: score,
    alpha: node.alpha,
    beta: node.beta,
    score,
  });
};

const minimax = (
  b: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  ctx: Ctx,
  capture: number,
  node: TreeNode | null,
): number => {
  ctx.nodesEvaluated++;
  if (node) {
    node.alpha = alpha;
    node.beta = beta;
    node.depth = depth;
    node.playerRole = maximizing ? "MAX" : "MIN";
    node.nodeType = maximizing ? "max" : "min";
  }
  pushStep(
    ctx,
    node,
    "explore",
    `${maximizing ? "MAX" : "MIN"} explores column ${node?.col === -1 ? "root" : (node?.col ?? 0) + 1}`,
  );

  const lastMover: Player = maximizing ? opponent(ctx.me) : ctx.me;
  const winLine = findWin(b, lastMover);
  if (winLine) {
    const s = lastMover === ctx.me ? 1_000_000 + depth : -1_000_000 - depth;
    if (node) {
      node.score = s;
      node.heuristic = s;
      node.nodeType = "leaf";
    }
    pushStep(ctx, node, "evaluate", `Terminal utility ${formatScore(s)}`, s);
    return s;
  }

  if (depth === 0 || isFull(b)) {
    const s = evaluate(b, ctx.me);
    if (node) {
      node.score = s;
      node.heuristic = s;
      node.nodeType = "leaf";
    }
    pushStep(
      ctx,
      node,
      "evaluate",
      `Heuristic evaluation ${formatScore(s)}`,
      s,
    );
    return s;
  }

  const key = serialize(b, depth, maximizing, ctx.me);
  const cached = ctx.options.useTranspositionTable
    ? ctx.table.get(key)
    : undefined;
  if (cached !== undefined) {
    ctx.cacheHits++;
    if (node) node.score = cached;
    pushStep(
      ctx,
      node,
      "evaluate",
      `Cached transposition value ${formatScore(cached)}`,
      cached,
    );
    return cached;
  }

  const moves = orderedLegal(b, ctx.options);
  let best = maximizing ? -Infinity : Infinity;
  let cutOff = false;

  for (const c of moves) {
    if (cutOff) {
      if (node && capture > 0) {
        node.children = node.children ?? [];
        node.children.push({
          id: ctx.nextNodeId++,
          col: c,
          score: 0,
          pruned: true,
          alpha,
          beta,
          depth: depth - 1,
          heuristic: 0,
          playerRole: maximizing ? "MIN" : "MAX",
          nodeType: "cutoff",
        });
      }
      ctx.nodesPruned++;
      pushStep(
        ctx,
        node,
        "prune",
        `${maximizing ? "beta" : "alpha"} cutoff prunes column ${c + 1}`,
      );
      continue;
    }

    const player: Player = maximizing ? ctx.me : opponent(ctx.me);
    const r = drop(b, c, player);
    let child: TreeNode | null = null;
    if (node && capture > 0) {
      child = {
        id: ctx.nextNodeId++,
        col: c,
        score: 0,
        alpha,
        beta,
        depth: depth - 1,
      };
      node.children = node.children ?? [];
      node.children.push(child);
    }

    const v = minimax(
      b,
      depth - 1,
      alpha,
      beta,
      !maximizing,
      ctx,
      capture > 0 ? capture - 1 : 0,
      child,
    );
    undrop(b, c, r);

    if (maximizing) {
      if (v > best) best = v;
      if (best > alpha) alpha = best;
    } else {
      if (v < best) best = v;
      if (best < beta) beta = best;
    }

    if (node) {
      node.alpha = alpha;
      node.beta = beta;
    }
    if (ctx.options.useAlphaBeta && beta <= alpha) {
      cutOff = true;
      if (node) node.nodeType = "cutoff";
      pushStep(
        ctx,
        node,
        "prune",
        `${maximizing ? "beta" : "alpha"} cutoff: alpha ${formatScore(alpha)} >= beta ${formatScore(beta)}`,
      );
    }
  }

  if (node) node.score = best;
  pushStep(
    ctx,
    node,
    "return",
    `Return ${maximizing ? "maximum" : "minimum"} utility ${formatScore(best)} to the parent call`,
    best,
  );
  if (!cutOff && ctx.options.useTranspositionTable) ctx.table.set(key, best);
  return best;
};

const explainMove = (
  b: Board,
  me: Player,
  chosen: number,
  perColumn: (number | null)[],
): string => {
  const them = opponent(me);

  const winBoard = cloneBoard(b);
  drop(winBoard, chosen, me);
  if (findWin(winBoard, me)) {
    return `AI plays column ${chosen + 1} because the successor state has terminal positive utility: a four-in-a-row win.`;
  }

  for (const c of legalCols(b)) {
    const t = cloneBoard(b);
    drop(t, c, them);
    if (findWin(t, them) && c === chosen) {
      return `AI plays column ${chosen + 1} because the opponent had an immediate winning successor, which creates a very high negative utility if not blocked.`;
    }
  }

  const future = cloneBoard(b);
  drop(future, chosen, me);
  let threats = 0;
  for (const c of legalCols(future)) {
    const t = cloneBoard(future);
    drop(t, c, me);
    if (findWin(t, me)) threats++;
  }
  if (threats >= 2) {
    return `AI plays column ${chosen + 1} because the resulting state creates multiple future winning actions, increasing the heuristic value and forcing a difficult defense.`;
  }

  if (chosen === 3) {
    return `AI plays column ${chosen + 1} because center columns create more future winning combinations and improve branching opportunities. Searching center moves early also improves alpha-beta pruning.`;
  }

  const score = perColumn[chosen];
  return `AI plays column ${chosen + 1} as the highest-evaluated long-term position (score ${score === null ? "?" : formatScore(score)}).`;
};

const searchAtDepth = (
  board: Board,
  me: Player,
  depth: number,
  table: Map<string, number>,
  captureTree: boolean,
  options: AIOptions,
  playbackLimit = 240,
) => {
  const ctx: Ctx = {
    me,
    nodesEvaluated: 0,
    nodesPruned: 0,
    cacheHits: 0,
    table,
    options,
    nextNodeId: 2,
    playback: [],
  };
  const root: TreeNode = {
    id: 1,
    col: -1,
    score: 0,
    alpha: -Infinity,
    beta: Infinity,
    depth,
    heuristic: 0,
    playerRole: "MAX",
    nodeType: "max",
  };

  const perColumn: (number | null)[] = Array(COLS).fill(null);
  let bestCol = -1;
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const c of orderedLegal(board, options)) {
    const r = drop(board, c, me);
    const child: TreeNode | null = captureTree
      ? {
          id: ctx.nextNodeId++,
          col: c,
          score: 0,
          alpha,
          beta,
          depth: depth - 1,
          heuristic: 0,
          playerRole: "MIN",
          nodeType: "min",
        }
      : null;
    if (child) {
      root.children = root.children ?? [];
      root.children.push(child);
    }

    const v = minimax(
      board,
      depth - 1,
      alpha,
      beta,
      false,
      ctx,
      captureTree ? 5 : 0,
      child,
    );
    undrop(board, c, r);

    perColumn[c] = v;
    if (v > bestScore) {
      bestScore = v;
      bestCol = c;
    }
    pushStep(
      ctx,
      root,
      "best",
      `MAX current best move is column ${bestCol + 1} with utility ${formatScore(bestScore)}`,
      bestScore,
      bestCol,
    );
    if (v > alpha) alpha = v;
    root.alpha = alpha;
  }

  root.score = bestScore;
  const top3 = (
    root.children ??
    orderedLegal(board, options).map((col) => ({
      col,
      score: perColumn[col] ?? 0,
    }))
  )
    .map((c) => ({ col: c.col, score: c.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    bestCol,
    bestScore,
    perColumn,
    top3,
    nodesEvaluated: ctx.nodesEvaluated,
    nodesPruned: ctx.nodesPruned,
    cacheHits: ctx.cacheHits,
    playback: ctx.playback.slice(0, playbackLimit),
    tree: root,
  };
};

const estimateBranchingFactor = (tree: TreeNode): number => {
  let internal = 0;
  let edges = 0;
  const visit = (node: TreeNode) => {
    const children = node.children ?? [];
    if (children.length) {
      internal++;
      edges += children.length;
      children.forEach(visit);
    }
  };
  visit(tree);
  return edges / Math.max(1, internal);
};

const buildComparison = (
  board: Board,
  me: Player,
  depth: number,
  options: AIOptions,
) => {
  const comparisonDepth = Math.min(depth, 5);
  const baseOptions = { ...options, useTranspositionTable: false };
  const minimaxStart = performance.now();
  const minimax = searchAtDepth(
    cloneBoard(board),
    me,
    comparisonDepth,
    new Map<string, number>(),
    false,
    { ...baseOptions, useAlphaBeta: false },
    0,
  );
  const minimaxTimeMs = performance.now() - minimaxStart;

  const alphaStart = performance.now();
  const alphaBeta = searchAtDepth(
    cloneBoard(board),
    me,
    comparisonDepth,
    new Map<string, number>(),
    false,
    { ...baseOptions, useAlphaBeta: true },
    0,
  );
  const alphaBetaTimeMs = performance.now() - alphaStart;
  const nodeReduction =
    1 - alphaBeta.nodesEvaluated / Math.max(1, minimax.nodesEvaluated);
  const runtimeReduction = 1 - alphaBetaTimeMs / Math.max(0.001, minimaxTimeMs);

  return {
    depth: comparisonDepth,
    minimaxNodes: minimax.nodesEvaluated,
    alphaBetaNodes: alphaBeta.nodesEvaluated,
    minimaxTimeMs,
    alphaBetaTimeMs,
    alphaBetaPruned: alphaBeta.nodesPruned,
    nodeReduction: Math.max(0, nodeReduction),
    runtimeReduction: Math.max(0, runtimeReduction),
  };
};

export const runAI = (
  board: Board,
  me: Player,
  depth: number,
  options: AIOptions = DEFAULT_AI_OPTIONS,
): AIResult => {
  const t0 = performance.now();
  const table = new Map<string, number>();
  const timeline: SearchTimelineStep[] = [];
  let final = searchAtDepth(board, me, 1, table, false, options);

  for (let d = 1; d <= depth; d++) {
    const start = performance.now();
    final = searchAtDepth(board, me, d, table, d === depth, options);
    timeline.push({
      depth: d,
      bestCol: final.bestCol,
      bestScore: final.bestScore,
      nodesEvaluated: final.nodesEvaluated,
      nodesPruned: final.nodesPruned,
      cacheHits: final.cacheHits,
      timeMs: performance.now() - start,
    });
  }

  const timeMs = performance.now() - t0;
  const chosenBoard = cloneBoard(board);
  drop(chosenBoard, final.bestCol, me);
  const evaluation: EvaluationBreakdown = evaluateBreakdown(chosenBoard, me);
  const comparison = buildComparison(board, me, depth, options);
  const branchingFactor = estimateBranchingFactor(final.tree);

  return {
    bestCol: final.bestCol,
    bestScore: final.bestScore,
    perColumn: final.perColumn,
    top3: final.top3,
    nodesEvaluated: final.nodesEvaluated,
    nodesPruned: final.nodesPruned,
    cacheHits: final.cacheHits,
    timeMs,
    depthReached: depth,
    branchingFactor,
    effectiveBranchingFactor: Math.pow(
      Math.max(1, final.nodesEvaluated),
      1 / Math.max(1, depth),
    ),
    recursiveCalls: final.nodesEvaluated,
    evaluatedStates: final.nodesEvaluated - final.cacheHits,
    nodesPerSecond: final.nodesEvaluated / Math.max(timeMs / 1000, 0.001),
    timeline,
    playback: final.playback,
    options,
    tree: final.tree,
    reason: explainMove(board, me, final.bestCol, final.perColumn),
    evaluation,
    comparison,
  };
};
