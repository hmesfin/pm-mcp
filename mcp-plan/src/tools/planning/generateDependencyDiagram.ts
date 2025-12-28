// src/tools/planning/generateDependencyDiagram.ts
/**
 * Generate Mermaid.js diagrams showing session dependency graphs.
 *
 * This module provides:
 * - Flowchart generation from session dependencies
 * - Critical path identification and highlighting
 * - Parallel execution opportunity visualization
 * - Domain-based color coding
 *
 * @module generateDependencyDiagram
 */

/**
 * Input session format - compatible with critiquePlan's parsed sessions
 */
export interface DiagramSession {
  number: number;
  title: string;
  dependencies: number[];
  domain?: string;
  estimatedTime?: string;
  objectives?: string[];
}

/**
 * Options for diagram generation
 */
export interface DiagramOptions {
  /** Diagram direction: TB (top-bottom), BT, LR (left-right), RL */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  /** Highlight the critical path with special styling */
  highlightCriticalPath?: boolean;
  /** Show parallel groups in subgraphs */
  showParallelGroups?: boolean;
  /** Color nodes by domain */
  colorByDomain?: boolean;
  /** Use different shapes for root/leaf nodes */
  showNodeShapes?: boolean;
  /** Maximum title length before truncation */
  maxTitleLength?: number;
  /** Wrap output in markdown code block */
  wrapInCodeBlock?: boolean;
  /** Include a legend explaining the diagram */
  includeLegend?: boolean;
}

/**
 * Parallel group of sessions that can run concurrently
 */
export interface ParallelGroup {
  sessions: number[];
  reason: string;
}

/**
 * Generated dependency diagram result
 */
export interface DependencyDiagram {
  /** Mermaid.js diagram syntax */
  mermaid: string;
  /** Session numbers on the critical path */
  criticalPath: number[];
  /** Groups of sessions that can run in parallel */
  parallelGroups: ParallelGroup[];
  /** Total number of nodes in the diagram */
  totalNodes: number;
  /** Total number of edges (dependencies) */
  totalEdges: number;
}

// Domain color definitions
const DOMAIN_COLORS: Record<string, { fill: string; stroke: string }> = {
  backend: { fill: '#e1f5fe', stroke: '#0277bd' },
  frontend: { fill: '#f3e5f5', stroke: '#7b1fa2' },
  mobile: { fill: '#e8f5e9', stroke: '#388e3c' },
  e2e: { fill: '#fff3e0', stroke: '#ef6c00' },
  infrastructure: { fill: '#fce4ec', stroke: '#c2185b' },
};

/**
 * Generate a Mermaid.js dependency diagram from sessions.
 *
 * @param sessions - Array of sessions with dependencies
 * @param options - Diagram generation options
 * @returns DependencyDiagram with mermaid syntax and analysis
 */
export function generateDependencyDiagram(
  sessions: DiagramSession[],
  options: DiagramOptions = {}
): DependencyDiagram {
  const {
    direction = 'TB',
    highlightCriticalPath = false,
    showParallelGroups = false,
    colorByDomain = false,
    showNodeShapes = false,
    maxTitleLength = 40,
    wrapInCodeBlock = false,
    includeLegend = false,
  } = options;

  // Handle empty sessions
  if (sessions.length === 0) {
    const emptyDiagram = `flowchart ${direction}\n    %% No sessions to display`;
    return {
      mermaid: wrapInCodeBlock ? wrapMermaid(emptyDiagram) : emptyDiagram,
      criticalPath: [],
      parallelGroups: [],
      totalNodes: 0,
      totalEdges: 0,
    };
  }

  // Build session lookup
  const sessionMap = new Map<number, DiagramSession>();
  for (const session of sessions) {
    sessionMap.set(session.number, session);
  }

  // Calculate critical path
  const criticalPath = calculateCriticalPath(sessions, sessionMap);

  // Find parallel groups
  const parallelGroups = findParallelGroups(sessions);

  // Count valid edges
  let edgeCount = 0;
  for (const session of sessions) {
    for (const dep of session.dependencies) {
      if (sessionMap.has(dep)) {
        edgeCount++;
      }
    }
  }

  // Generate Mermaid diagram
  const lines: string[] = [];
  lines.push(`flowchart ${direction}`);

  // Add class definitions if coloring by domain
  if (colorByDomain) {
    lines.push('');
    lines.push('    %% Domain styles');
    for (const [domain, colors] of Object.entries(DOMAIN_COLORS)) {
      lines.push(`    classDef ${domain} fill:${colors.fill},stroke:${colors.stroke},stroke-width:2px`);
    }
    lines.push('    classDef critical fill:#ffeb3b,stroke:#f57f17,stroke-width:3px');
  }

  // Add nodes with parallel grouping if enabled
  if (showParallelGroups && parallelGroups.length > 0) {
    lines.push('');
    const groupedSessions = new Set<number>();

    for (let i = 0; i < parallelGroups.length; i++) {
      const group = parallelGroups[i];
      if (group.sessions.length >= 2) {
        lines.push(`    subgraph parallel${i + 1}["Parallel Group ${i + 1}"]`);
        for (const sessionNum of group.sessions) {
          const session = sessionMap.get(sessionNum);
          if (session) {
            lines.push(`        ${formatNode(session, showNodeShapes, maxTitleLength, sessionMap)}`);
            groupedSessions.add(sessionNum);
          }
        }
        lines.push('    end');
      }
    }

    // Add ungrouped sessions
    lines.push('');
    lines.push('    %% Individual sessions');
    for (const session of sessions) {
      if (!groupedSessions.has(session.number)) {
        lines.push(`    ${formatNode(session, showNodeShapes, maxTitleLength, sessionMap)}`);
      }
    }
  } else {
    // Add all nodes without grouping
    lines.push('');
    lines.push('    %% Session nodes');
    for (const session of sessions) {
      lines.push(`    ${formatNode(session, showNodeShapes, maxTitleLength, sessionMap)}`);
    }
  }

  // Add edges
  lines.push('');
  lines.push('    %% Dependencies');
  // criticalPath is used for edge styling below
  const criticalEdges: number[] = [];
  let edgeIndex = 0;

  for (const session of sessions) {
    for (const dep of session.dependencies) {
      if (sessionMap.has(dep)) {
        lines.push(`    S${dep} --> S${session.number}`);

        // Track critical path edges for styling
        if (highlightCriticalPath) {
          const depIdx = criticalPath.indexOf(dep);
          const sessionIdx = criticalPath.indexOf(session.number);
          if (depIdx !== -1 && sessionIdx !== -1 && sessionIdx === depIdx + 1) {
            criticalEdges.push(edgeIndex);
          }
        }
        edgeIndex++;
      }
    }
  }

  // Apply domain classes to nodes
  if (colorByDomain) {
    lines.push('');
    lines.push('    %% Apply domain classes');
    for (const session of sessions) {
      const domain = session.domain || 'infrastructure';
      if (DOMAIN_COLORS[domain]) {
        lines.push(`    class S${session.number} ${domain}`);
      }
    }
  }

  // Highlight critical path
  if (highlightCriticalPath && criticalPath.length > 0) {
    lines.push('');
    lines.push('    %% Critical path highlighting');
    for (const sessionNum of criticalPath) {
      lines.push(`    style S${sessionNum} stroke:#f44336,stroke-width:4px`);
    }
    if (criticalEdges.length > 0) {
      lines.push(`    linkStyle ${criticalEdges.join(',')} stroke:#f44336,stroke-width:3px`);
    }
  }

  // Add legend if requested
  if (includeLegend && colorByDomain) {
    lines.push('');
    lines.push('    %% Legend');
    lines.push('    subgraph Legend');
    lines.push('        L1[Backend]:::backend');
    lines.push('        L2[Frontend]:::frontend');
    lines.push('        L3[Mobile]:::mobile');
    lines.push('        L4[E2E]:::e2e');
    lines.push('        L5[Infrastructure]:::infrastructure');
    lines.push('    end');
  }

  let mermaid = lines.join('\n');
  if (wrapInCodeBlock) {
    mermaid = wrapMermaid(mermaid);
  }

  return {
    mermaid,
    criticalPath,
    parallelGroups,
    totalNodes: sessions.length,
    totalEdges: edgeCount,
  };
}

/**
 * Format a session as a Mermaid node
 */
function formatNode(
  session: DiagramSession,
  showNodeShapes: boolean,
  maxTitleLength: number,
  sessionMap: Map<number, DiagramSession>
): string {
  const title = truncateTitle(escapeTitle(session.title), maxTitleLength);
  const nodeId = `S${session.number}`;

  if (!showNodeShapes) {
    return `${nodeId}["${session.number}. ${title}"]`;
  }

  // Determine node type
  const isRoot = session.dependencies.length === 0;
  const isLeaf = !hasDependent(session.number, sessionMap);

  if (isRoot && isLeaf) {
    // Isolated node - circle
    return `${nodeId}(("${session.number}. ${title}"))`;
  } else if (isRoot) {
    // Root node - stadium shape
    return `${nodeId}(["${session.number}. ${title}"])`;
  } else if (isLeaf) {
    // Leaf node - hexagon
    return `${nodeId}{{"${session.number}. ${title}"}}`;
  } else {
    // Normal node - rectangle
    return `${nodeId}["${session.number}. ${title}"]`;
  }
}

/**
 * Check if a session has any dependents
 */
function hasDependent(sessionNumber: number, sessionMap: Map<number, DiagramSession>): boolean {
  for (const session of sessionMap.values()) {
    if (session.dependencies.includes(sessionNumber)) {
      return true;
    }
  }
  return false;
}

/**
 * Escape special characters in titles for Mermaid
 */
function escapeTitle(title: string): string {
  return title
    .replace(/"/g, "'")
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Truncate title to max length
 */
function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.slice(0, maxLength - 3) + '...';
}

/**
 * Wrap Mermaid content in markdown code block
 */
function wrapMermaid(content: string): string {
  return `\`\`\`mermaid\n${content}\n\`\`\``;
}

/**
 * Calculate the critical path through the dependency graph.
 * The critical path is the longest path (by time or node count).
 */
function calculateCriticalPath(
  sessions: DiagramSession[],
  sessionMap: Map<number, DiagramSession>
): number[] {
  if (sessions.length === 0) return [];
  if (sessions.length === 1) return [sessions[0].number];

  // Build reverse dependency map (who depends on whom)
  const dependents = new Map<number, number[]>();
  for (const session of sessions) {
    if (!dependents.has(session.number)) {
      dependents.set(session.number, []);
    }
    for (const dep of session.dependencies) {
      if (!dependents.has(dep)) {
        dependents.set(dep, []);
      }
      dependents.get(dep)!.push(session.number);
    }
  }

  // Find root nodes (no dependencies)
  const roots = sessions.filter(s => s.dependencies.length === 0);

  // Use dynamic programming to find longest path from each root
  const longestPath = new Map<number, { length: number; path: number[] }>();

  function dfs(nodeNum: number): { length: number; path: number[] } {
    if (longestPath.has(nodeNum)) {
      return longestPath.get(nodeNum)!;
    }

    const session = sessionMap.get(nodeNum);
    if (!session) {
      return { length: 0, path: [] };
    }

    const nodeTime = parseTime(session.estimatedTime);
    const deps = dependents.get(nodeNum) || [];

    if (deps.length === 0) {
      // Leaf node
      const result = { length: nodeTime, path: [nodeNum] };
      longestPath.set(nodeNum, result);
      return result;
    }

    let maxSubpath = { length: 0, path: [] as number[] };
    for (const dep of deps) {
      const subpath = dfs(dep);
      if (subpath.length > maxSubpath.length) {
        maxSubpath = subpath;
      }
    }

    const result = {
      length: nodeTime + maxSubpath.length,
      path: [nodeNum, ...maxSubpath.path],
    };
    longestPath.set(nodeNum, result);
    return result;
  }

  // Find longest path from any root
  let criticalPath: number[] = [];
  let maxLength = 0;

  for (const root of roots) {
    const result = dfs(root.number);
    if (result.length > maxLength) {
      maxLength = result.length;
      criticalPath = result.path;
    }
  }

  return criticalPath;
}

/**
 * Parse time string to hours
 */
function parseTime(timeStr?: string): number {
  if (!timeStr) return 1;
  const match = timeStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 1;
}

/**
 * Find groups of sessions that can run in parallel
 */
function findParallelGroups(sessions: DiagramSession[]): ParallelGroup[] {
  const groups: ParallelGroup[] = [];

  // Group by same dependencies
  const depGroups = new Map<string, number[]>();
  for (const session of sessions) {
    const depKey = [...session.dependencies].sort().join(',') || 'root';
    if (!depGroups.has(depKey)) {
      depGroups.set(depKey, []);
    }
    depGroups.get(depKey)!.push(session.number);
  }

  // Convert to parallel groups
  for (const [depKey, sessionNums] of depGroups) {
    if (sessionNums.length >= 2) {
      groups.push({
        sessions: sessionNums,
        reason: depKey === 'root'
          ? 'Sessions have no dependencies and can start immediately'
          : `Sessions share dependencies [${depKey}] and can run concurrently`,
      });
    }
  }

  return groups;
}
