// src/services/planParser.ts
// Parse PROJECT_PLAN.md into structured data

import { Phase, Session, SessionStatus } from "../types/common.js";

export interface ParsedPlan {
  projectName: string;
  description: string;
  complexity: string;
  phases: Phase[];
  totalSessions: number;
  totalEstimatedTime: string;
}

export function parsePlan(content: string): ParsedPlan {

  // Extract project name
  const titleMatch = content.match(/^#\s+Project Plan:\s+(.+)/m);
  const projectName = titleMatch ? titleMatch[1].trim() : "Unnamed Project";

  // Extract description from ## Overview
  const overviewMatch = content.match(/##\s+Overview\s+([\s\S]+?)(?=##|$)/);
  const description = overviewMatch ? overviewMatch[1].trim().split("\n")[0] : "";

  // Extract complexity
  const complexityMatch = content.match(/\*\*Complexity Level\*\*:\s+(\w+)/);
  const complexity = complexityMatch ? complexityMatch[1].toLowerCase() : "intermediate";

  // Extract total estimates
  const totalMatch = content.match(/##\s+Total Estimates[\s\S]+?-\s+\*\*Total Sessions\*\*:\s+(\d+)[\s\S]+?-\s+\*\*Estimated Time\*\*:\s+([\d\-]+h)/);
  const totalSessions = totalMatch ? parseInt(totalMatch[1]) : 0;
  const totalEstimatedTime = totalMatch ? totalMatch[2] : "0h";

  // Parse phases
  const phases: Phase[] = [];
  const phaseMatches = content.matchAll(/###\s+(Phase\s+\d+):\s+(.+)\n\*\*Goal\*\*:\s+(.+)([\s\S]+?)(?=###\s+Phase|\n##|$)/g);

  let sessionNumber = 1;

  for (const phaseMatch of phaseMatches) {
    const phaseTitle = phaseMatch[1]; // "Phase 1"
    const phaseName = phaseMatch[2]; // e.g., "Core Infrastructure"
    const phaseGoal = phaseMatch[3];
    const phaseContent = phaseMatch[4];

    const phaseNumberMatch = phaseTitle.match(/Phase\s+(\d+)/);
    const phaseNumber = phaseNumberMatch ? parseInt(phaseNumberMatch[1]) : phases.length + 1;

    // Parse sessions in this phase
    const sessions: Session[] = [];
    const sessionMatches = phaseContent.matchAll(/\d+\.\s+\*\*Session\s+\d+:\s+(.+?)\*\*\s+\((.+?)\)([\s\S]+?)(?=\d+\.\s+\*\*Session|\n###|\n##|$)/g);

    for (const sessionMatch of sessionMatches) {
      const title = sessionMatch[1].trim();
      const estimatedTime = sessionMatch[2].trim();
      const sessionContent = sessionMatch[3];

      // Extract objectives (bullet points)
      const objectives: string[] = [];
      const objectiveMatches = sessionContent.matchAll(/^\s+-\s+(.+)$/gm);
      for (const objMatch of objectiveMatches) {
        objectives.push(objMatch[1].trim());
      }

      // Determine domain from title
      const domain = determineDomain(title);

      const session: Session = {
        number: sessionNumber++,
        title,
        phase: phaseNumber,
        phaseName,
        domain,
        objectives,
        tddWorkflow: {
          redPhase: [],
          greenPhase: [],
          refactorPhase: [],
        },
        filesToCreate: [],
        filesToModify: [],
        dependencies: [],
        exitCriteria: [],
        estimatedTime: { estimated: estimatedTime },
        estimatedTests: estimateTests(objectives.length),
        status: "not_started" as SessionStatus,
      };

      sessions.push(session);
    }

    const phase: Phase = {
      number: phaseNumber,
      name: phaseName,
      goal: phaseGoal,
      sessions,
      deliverables: [],
      estimatedTime: calculatePhaseTime(sessions),
      status: "not_started",
      completedSessions: 0,
      totalSessions: sessions.length,
    };

    phases.push(phase);
  }

  return {
    projectName,
    description,
    complexity,
    phases,
    totalSessions,
    totalEstimatedTime,
  };
}

function determineDomain(title: string): "backend" | "frontend" | "mobile" | "e2e" | "infrastructure" {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("backend") || lowerTitle.includes("api") || lowerTitle.includes("database")) {
    return "backend";
  }
  if (lowerTitle.includes("frontend") || lowerTitle.includes("ui") || lowerTitle.includes("component")) {
    return "frontend";
  }
  if (lowerTitle.includes("mobile") || lowerTitle.includes("react native")) {
    return "mobile";
  }
  if (lowerTitle.includes("e2e") || lowerTitle.includes("integration") || lowerTitle.includes("testing")) {
    return "e2e";
  }
  return "infrastructure";
}

function estimateTests(objectiveCount: number): number {
  return objectiveCount * 5; // Rough estimate: 5 tests per objective
}

function calculatePhaseTime(sessions: Session[]): string {
  let totalHours = 0;
  for (const session of sessions) {
    const hourMatch = session.estimatedTime.estimated.match(/(\d+(?:\.\d+)?)/);
    if (hourMatch) {
      totalHours += parseFloat(hourMatch[1]);
    }
  }
  return `${totalHours}h`;
}
