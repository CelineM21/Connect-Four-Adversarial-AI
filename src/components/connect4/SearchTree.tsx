import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TreeNode } from "@/lib/connect4/types";

interface Props {
  tree: TreeNode;
  bestCol: number;
  activeNodeId?: number;
  fullscreen?: boolean;
}

interface Laid {
  node: TreeNode;
  x: number;
  y: number;
  parent?: Laid;
  onBest: boolean;
  level: number;
  label: string;
}

const NODE_W = 104;
const LEVEL_H = 118;
const PAD_X = 72;
const PAD_Y = 68;

const scoreLabel = (score: number) => {
  if (Math.abs(score) >= 1_000_000) return score > 0 ? "+inf" : "-inf";
  return score.toFixed(0);
};

const boundLabel = (value?: number) => {
  if (value === undefined) return "?";
  if (value === Infinity) return "+inf";
  if (value === -Infinity) return "-inf";
  return value.toFixed(0);
};

const displayChildren = (
  node: TreeNode,
  expanded: Set<number>,
  fullscreen: boolean,
) => {
  if (node.id && !expanded.has(node.id) && node.children?.length) return [];
  const children = node.children ?? [];
  if (fullscreen) return children;
  if (node.col === -1) return children;
  const sorted = children.slice().sort((a, b) => {
    if (a.pruned !== b.pruned) return a.pruned ? 1 : -1;
    return Math.abs(b.score) - Math.abs(a.score);
  });
  return sorted.slice(0, node.depth && node.depth > 3 ? 4 : 3);
};

const measure = (
  node: TreeNode,
  expanded: Set<number>,
  fullscreen: boolean,
): number => {
  const children = displayChildren(node, expanded, fullscreen);
  if (!children.length) return NODE_W;
  return Math.max(
    NODE_W,
    children.reduce(
      (sum, child) => sum + measure(child, expanded, fullscreen),
      0,
    ) +
      (children.length - 1) * (fullscreen ? 34 : 24),
  );
};

const layoutTree = (
  tree: TreeNode,
  bestCol: number,
  expanded: Set<number>,
  fullscreen: boolean,
) => {
  const laid: Laid[] = [];
  const edges: Laid[] = [];
  let maxDepth = 0;
  const totalWidth = measure(tree, expanded, fullscreen);

  const visit = (
    node: TreeNode,
    left: number,
    level: number,
    parent: Laid | undefined,
    onBest: boolean,
  ) => {
    const width = measure(node, expanded, fullscreen);
    const laidNode: Laid = {
      node,
      x: left + width / 2,
      y: PAD_Y + level * LEVEL_H,
      parent,
      onBest,
      level,
      label: node.col === -1 ? "root" : `c${node.col + 1}`,
    };
    laid.push(laidNode);
    if (parent) edges.push(laidNode);
    maxDepth = Math.max(maxDepth, level);

    const children = displayChildren(node, expanded, fullscreen);
    let childLeft = left;
    children.forEach((child, index) => {
      const childWidth = measure(child, expanded, fullscreen);
      const childOnBest =
        onBest &&
        !child.pruned &&
        (level === 0
          ? child.col === bestCol
          : index === 0 || child.score === node.score);
      visit(child, childLeft, level + 1, laidNode, childOnBest);
      childLeft += childWidth + (fullscreen ? 34 : 24);
    });
  };

  visit(tree, PAD_X, 0, undefined, true);
  return {
    nodes: laid,
    edges,
    width: Math.max(720, totalWidth + PAD_X * 2),
    height: PAD_Y * 2 + (maxDepth + 1) * LEVEL_H,
  };
};

export function SearchTree({
  tree,
  bestCol,
  activeNodeId,
  fullscreen = false,
}: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(
    () =>
      new Set<number>([
        1,
        ...(tree.children ?? []).map((child) => child.id ?? 0),
      ]),
  );
  const [zoom, setZoom] = useState(fullscreen ? 0.88 : 1);
  const layout = useMemo(
    () => layoutTree(tree, bestCol, expanded, fullscreen),
    [tree, bestCol, expanded, fullscreen],
  );

  const toggle = (node: TreeNode) => {
    if (!node.id || !node.children?.length) return;
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(node.id!)) next.delete(node.id!);
      else next.add(node.id!);
      return next;
    });
  };

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div>
          Zoom {(zoom * 100).toFixed(0)}% · drag horizontally/vertically in
          fullscreen
        </div>
        <input
          aria-label="Tree zoom"
          type="range"
          min="0.45"
          max="1.35"
          step="0.05"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="w-28 accent-[color:var(--player2)]"
        />
      </div>
      <div
        className={`${fullscreen ? "h-[calc(100vh-180px)]" : "h-[390px]"} overflow-auto rounded-xl scroll-thin bg-black/10`}
      >
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width * zoom}
          height={layout.height * zoom}
          className="min-w-full"
          role="img"
          aria-label="Animated minimax search tree with alpha beta bounds and utility values"
        >
          {Array.from({
            length: Math.ceil((layout.height - PAD_Y) / LEVEL_H),
          }).map((_, level) => (
            <g key={level}>
              <line
                x1={24}
                y1={PAD_Y + level * LEVEL_H + 42}
                x2={layout.width - 24}
                y2={PAD_Y + level * LEVEL_H + 42}
                stroke="color-mix(in oklab, var(--panel-border) 55%, transparent)"
                strokeDasharray="2 10"
              />
              <text
                x={28}
                y={PAD_Y + level * LEVEL_H - 36}
                fontSize="11"
                fill="currentColor"
                className="text-muted-foreground"
              >
                depth {level} ·{" "}
                {level % 2 === 0
                  ? "MAX utility propagation"
                  : "MIN adversarial response"}
              </text>
            </g>
          ))}

          {layout.edges.map((node, i) => (
            <motion.line
              key={`e-${node.node.id ?? i}`}
              x1={node.parent!.x}
              y1={node.parent!.y + 34}
              x2={node.x}
              y2={node.y - 34}
              stroke={
                node.node.pruned
                  ? "var(--bad)"
                  : node.onBest
                    ? "var(--good)"
                    : "color-mix(in oklab, var(--panel-border) 90%, transparent)"
              }
              strokeWidth={node.onBest ? 3 : 1.3}
              opacity={node.node.pruned ? 0.55 : 0.92}
              strokeDasharray={node.node.pruned ? "7 6" : undefined}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.01 * i }}
            />
          ))}

          {layout.nodes.map((node, i) => {
            const active = node.node.id === activeNodeId;
            const fill = active
              ? "var(--player2)"
              : node.node.pruned
                ? "color-mix(in oklab, var(--bad) 72%, transparent)"
                : node.onBest
                  ? "color-mix(in oklab, var(--good) 70%, transparent)"
                  : node.node.nodeType === "min"
                    ? "color-mix(in oklab, var(--player1) 42%, var(--card))"
                    : "color-mix(in oklab, var(--player2) 28%, var(--card))";
            return (
              <motion.g
                key={`n-${node.node.id ?? i}`}
                opacity={node.node.pruned ? 0.66 : 1}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: node.node.pruned ? 0.66 : 1 }}
                transition={{ duration: 0.25, delay: 0.015 * i }}
                onClick={() => toggle(node.node)}
                className={node.node.children?.length ? "cursor-pointer" : ""}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              >
                {active && (
                  <motion.rect
                    x={node.x - 62}
                    y={node.y - 42}
                    width={124}
                    height={84}
                    rx={16}
                    fill="transparent"
                    stroke="var(--player2)"
                    strokeWidth={2}
                    animate={{ opacity: [0.25, 0.85, 0.25] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                <rect
                  x={node.x - 52}
                  y={node.y - 32}
                  width={104}
                  height={64}
                  rx={14}
                  fill={fill}
                  stroke={
                    node.onBest || active
                      ? "var(--good)"
                      : "color-mix(in oklab, var(--panel-border) 90%, transparent)"
                  }
                  strokeWidth={active ? 2.4 : node.onBest ? 1.9 : 1.1}
                />
                <title>{`${node.node.playerRole ?? node.node.nodeType ?? "node"} | move ${node.label} | utility ${scoreLabel(node.node.score)} | heuristic ${scoreLabel(node.node.heuristic ?? node.node.score)} | alpha ${boundLabel(node.node.alpha)} | beta ${boundLabel(node.node.beta)} | depth ${node.level}${node.node.pruned ? " | PRUNED" : ""}`}</title>
                <text
                  x={node.x - 42}
                  y={node.y - 15}
                  fontSize="10"
                  fill="currentColor"
                  className="font-semibold"
                >
                  {node.node.playerRole ??
                    (node.node.nodeType === "min" ? "MIN" : "MAX")}
                </text>
                <text
                  x={node.x + 42}
                  y={node.y - 15}
                  fontSize="10"
                  textAnchor="end"
                  fill="currentColor"
                  className="text-muted-foreground"
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 2}
                  fontSize="12"
                  textAnchor="middle"
                  fill="currentColor"
                  className="font-display font-semibold"
                >
                  U={scoreLabel(node.node.score)}
                </text>
                <text
                  x={node.x}
                  y={node.y + 17}
                  fontSize="8"
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-muted-foreground"
                >
                  α {boundLabel(node.node.alpha)} · β{" "}
                  {boundLabel(node.node.beta)} · d{node.level}
                </text>
                {node.node.pruned && (
                  <text
                    x={node.x}
                    y={node.y + 45}
                    fontSize="9"
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[color:var(--bad)] font-semibold"
                  >
                    PRUNED α ≥ β
                  </text>
                )}
                {!!node.node.children?.length && (
                  <text
                    x={node.x + 62}
                    y={node.y - 28}
                    fontSize="11"
                    fill="currentColor"
                    className="text-muted-foreground"
                  >
                    {node.node.id && expanded.has(node.node.id) ? "−" : "+"}
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
      {fullscreen && (
        <div className="pointer-events-none absolute bottom-4 right-4 w-44 rounded-xl border border-[color:var(--panel-border)] bg-background/80 p-2 text-[10px] text-muted-foreground backdrop-blur">
          Minimap: full captured search frontier · green path = backed-up
          principal variation · red = alpha-beta cutoff.
        </div>
      )}
    </div>
  );
}
