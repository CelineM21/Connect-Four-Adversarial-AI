# Connect-Four Adversarial AI

An interactive Connect Four game featuring an AI opponent powered by Minimax search with Alpha-Beta pruning, move ordering, iterative deepening, and a transposition table.

## Overview

This project implements an AI-powered Connect Four game using adversarial search. The AI evaluates possible moves by considering its own best outcomes and the opponent's strongest responses.

The application combines a React-based interactive interface with a TypeScript AI engine designed to make strategic decisions efficiently.

## Features

- **Interactive gameplay:** Play Connect Four against an AI opponent on a standard 6 × 7 board.
- **Four difficulty levels:** Easy (depth 2), Medium (depth 4), Hard (depth 6), and Expert (depth 8).
- **Minimax search:** Evaluates possible future game states by alternating between maximizing and minimizing players.
- **Alpha-Beta pruning:** Skips branches that cannot influence the final decision.
- **Move ordering:** Prioritizes the center columns to improve pruning efficiency.
- **Transposition table:** Caches previously evaluated board positions to reduce redundant computation.
- **Iterative deepening:** Searches progressively deeper levels while reusing cached results.
- **Heuristic evaluation:** Scores potential winning combinations, threats, defensive opportunities, and center control.
- **Efficient state management:** Uses move-and-undo operations during search to avoid unnecessary board cloning.

## AI Algorithm

### Minimax with Alpha-Beta Pruning

The AI searches a game tree containing alternating maximizing and minimizing turns. It selects moves based on the minimax value of each candidate position, assuming that both players make strategically strong decisions.

Alpha-Beta pruning maintains upper and lower bounds on achievable values, allowing the search to eliminate branches that cannot change the final decision.

### Heuristic Evaluation

When the search reaches its depth limit, a heuristic function evaluates the board using:

- Potential four-in-a-row combinations.
- Immediate winning opportunities.
- Opponent threats and defensive blocking.
- Center-column control.

Winning and losing states receive large positive and negative utility values, respectively, with depth-sensitive scoring to favor faster wins and delayed losses.

## Optimization Techniques

| Technique | Purpose |
|---|---|
| Alpha-Beta pruning | Reduces the number of nodes explored |
| Center-first move ordering | Improves the effectiveness of pruning |
| Transposition table | Reuses evaluations of previously encountered positions |
| Iterative deepening | Reuses information from shallower searches |
| Move undo | Avoids allocating a new board at every search node |

## Technology Stack

- **Language:** TypeScript
- **Frontend:** React
- **Application framework:** TanStack Start
- **AI:** Minimax with Alpha-Beta pruning

## Project Architecture

The application separates the AI engine from the user interface.

The AI core exposes a `runAI(board, player, depth, options)` function that evaluates the current position and returns an AI result. The React layer manages the game state and user interactions.

This separation makes the search algorithm easier to test and maintain independently of the interface.

## Complexity and Performance

Search performance depends on the board position, search depth, move ordering, and transposition-table cache hits.

The project report describes an effective branching factor of approximately 2.6–3.2 with center-first ordering and reports approximately 50,000–200,000 searched nodes per move at Expert difficulty, with execution under 500 ms in the reported test environment.

These figures are environment-dependent and should be treated as reported measurements rather than universal performance guarantees.

## Future Improvements

Potential extensions include improving heuristic evaluation, benchmarking search performance across different board positions, and exploring additional optimizations for deeper searches.

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/CelineM21/Connect-Four-Adversarial-AI.git
cd Connect-Four-Adversarial-AI
```

Install dependencies:

```bash
npm install
```

Start the development server using the script defined in `package.json`. For example, if the project defines a `dev` script:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

## Project Purpose

Developed as an academic project to explore adversarial search, game-tree evaluation, and optimization techniques for intelligent decision-making.