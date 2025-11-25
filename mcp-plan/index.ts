// src/index.ts
// Main MCP server implementation

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Tool implementations
import { generateProjectPlan } from "./src/tools/planning/generateProjectPlan.js";
import { analyzeRequirements } from "./src/tools/planning/analyzeRequirements.js";
import { critiquePlan } from "./src/tools/planning/critiquePlan.js";
import { setupGitHubProject } from "./src/tools/github/setupGitHubProject.js";
import { trackProgress } from "./src/tools/github/trackProgress.js";
import { syncWithGitHub } from "./src/tools/github/syncWithGitHub.js";

const server = new Server(
  {
    name: "project-planner",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// ============================================================================
// TOOL REGISTRATION
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ========== PLANNING TOOLS ==========
      {
        name: "conductDiscovery",
        description: "Interactive AI-driven discovery session to gather project requirements through intelligent questions that challenge assumptions and find gaps",
        inputSchema: {
          type: "object",
          properties: {
            projectType: {
              type: "string",
              enum: ["blog", "ecommerce", "saas", "social", "projectmanagement", "custom"],
              description: "Type of project to plan (optional, will ask if not provided)",
            },
            conversationHistory: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["assistant", "user"] },
                  content: { type: "string" },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
              description: "Previous conversation history to maintain context",
            },
          },
        },
      },
      {
        name: "analyzeRequirements",
        description: "Analyze requirements document for completeness, clarity, conflicts, gaps, and feasibility. Challenges assumptions and finds missing pieces.",
        inputSchema: {
          type: "object",
          properties: {
            requirements: {
              type: "string",
              description: "Requirements document content (markdown)",
            },
            projectType: {
              type: "string",
              enum: ["blog", "ecommerce", "saas", "social", "projectmanagement", "custom"],
              description: "Project type for domain-specific analysis",
            },
          },
          required: ["requirements"],
        },
      },
      {
        name: "generateProjectPlan",
        description: "Generate comprehensive PROJECT_PLAN.md and REQUIREMENTS.md files from discovery summary or requirements",
        inputSchema: {
          type: "object",
          properties: {
            requirementsPath: {
              type: "string",
              description: "Path to existing REQUIREMENTS.md file",
            },
            requirements: {
              type: "string",
              description: "Requirements content (if not using file path)",
            },
            discoverySummary: {
              type: "object",
              description: "Summary from conductDiscovery tool",
            },
            outputPath: {
              type: "string",
              description: "Directory where plan files will be created",
            },
            templateType: {
              type: "string",
              enum: ["blog", "ecommerce", "saas", "social", "projectmanagement", "custom"],
              description: "Template to use as base",
            },
            customizations: {
              type: "object",
              description: "Template customization options",
            },
          },
          required: ["outputPath"],
        },
      },
      {
        name: "critiquePlan",
        description: "Review and critique an existing project plan for issues, opportunities, and improvements",
        inputSchema: {
          type: "object",
          properties: {
            planPath: {
              type: "string",
              description: "Path to PROJECT_PLAN.md file",
            },
          },
          required: ["planPath"],
        },
      },

      // ========== GITHUB INTEGRATION TOOLS ==========
      {
        name: "setupGitHubProject",
        description: "Set up GitHub project board, issues, milestones, and labels from a project plan",
        inputSchema: {
          type: "object",
          properties: {
            owner: {
              type: "string",
              description: "GitHub repository owner",
            },
            repo: {
              type: "string",
              description: "GitHub repository name",
            },
            planPath: {
              type: "string",
              description: "Path to PROJECT_PLAN.md file",
            },
            createProject: {
              type: "boolean",
              description: "Create GitHub Project board (default: true)",
              default: true,
            },
            createMilestones: {
              type: "boolean",
              description: "Create milestones per phase (default: true)",
              default: true,
            },
            labels: {
              type: "object",
              properties: {
                phases: { type: "boolean", default: true },
                domains: { type: "boolean", default: true },
                sessions: { type: "boolean", default: true },
                tddPhases: { type: "boolean", default: true },
                custom: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      color: { type: "string" },
                      description: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          required: ["owner", "repo", "planPath"],
        },
      },
      {
        name: "syncWithGitHub",
        description: "Synchronize project state between .agent-state.json and GitHub issues/project board",
        inputSchema: {
          type: "object",
          properties: {
            owner: {
              type: "string",
              description: "GitHub repository owner",
            },
            repo: {
              type: "string",
              description: "GitHub repository name",
            },
            direction: {
              type: "string",
              enum: ["pull", "push", "bidirectional"],
              description: "Sync direction: pull (GitHub → local), push (local → GitHub), bidirectional",
            },
            statePath: {
              type: "string",
              description: "Path to .agent-state.json (auto-detected if not provided)",
            },
          },
          required: ["owner", "repo", "direction"],
        },
      },
      {
        name: "trackProgress",
        description: "Query GitHub to track project execution progress, metrics, and status",
        inputSchema: {
          type: "object",
          properties: {
            owner: {
              type: "string",
              description: "GitHub repository owner",
            },
            repo: {
              type: "string",
              description: "GitHub repository name",
            },
            format: {
              type: "string",
              enum: ["summary", "detailed", "json"],
              description: "Output format",
              default: "summary",
            },
          },
          required: ["owner", "repo"],
        },
      },
      {
        name: "updateSessionStatus",
        description: "Update session status in GitHub issue and project board",
        inputSchema: {
          type: "object",
          properties: {
            owner: {
              type: "string",
              description: "GitHub repository owner",
            },
            repo: {
              type: "string",
              description: "GitHub repository name",
            },
            sessionNumber: {
              type: "number",
              description: "Session number to update",
            },
            status: {
              type: "string",
              enum: ["not_started", "in_progress", "red_phase", "green_phase", "refactor_phase", "awaiting_approval", "completed", "blocked", "skipped"],
              description: "New session status",
            },
            phase: {
              type: "string",
              enum: ["not_started", "red", "green", "refactor", "complete"],
              description: "TDD phase",
            },
            metrics: {
              type: "object",
              properties: {
                testsWritten: { type: "number" },
                testsPassing: { type: "number" },
                testsFailing: { type: "number" },
                coverage: { type: "number" },
                typeCheckPassing: { type: "boolean" },
                lintPassing: { type: "boolean" },
              },
              description: "Test metrics",
            },
            comment: {
              type: "string",
              description: "Optional comment to add to issue",
            },
            moveProjectCard: {
              type: "boolean",
              description: "Automatically move card on project board",
              default: true,
            },
          },
          required: ["owner", "repo", "sessionNumber", "status"],
        },
      },
      {
        name: "findNextSession",
        description: "Find the next session to execute based on dependencies and current progress",
        inputSchema: {
          type: "object",
          properties: {
            owner: {
              type: "string",
              description: "GitHub repository owner",
            },
            repo: {
              type: "string",
              description: "GitHub repository name",
            },
            considerDependencies: {
              type: "boolean",
              description: "Only suggest sessions with satisfied dependencies",
              default: true,
            },
            preferDomain: {
              type: "string",
              enum: ["backend", "frontend", "mobile", "e2e", "infrastructure"],
              description: "Prefer sessions in this domain",
            },
          },
          required: ["owner", "repo"],
        },
      },

      // ========== INTELLIGENCE TOOLS ==========
      {
        name: "reviewArchitecture",
        description: "Review project architecture for patterns, anti-patterns, scalability, security, and testability",
        inputSchema: {
          type: "object",
          properties: {
            planPath: {
              type: "string",
              description: "Path to PROJECT_PLAN.md",
            },
            requirementsPath: {
              type: "string",
              description: "Path to REQUIREMENTS.md",
            },
            plan: {
              type: "string",
              description: "Plan content (if not using file path)",
            },
            requirements: {
              type: "string",
              description: "Requirements content (if not using file path)",
            },
            focus: {
              type: "string",
              enum: ["backend", "frontend", "mobile", "infrastructure", "all"],
              description: "Focus area for review",
              default: "all",
            },
          },
        },
      },
      {
        name: "estimateEffort",
        description: "Data-driven effort estimation based on requirements, complexity, and historical project data",
        inputSchema: {
          type: "object",
          properties: {
            requirements: {
              type: "string",
              description: "Requirements document content",
            },
            plan: {
              type: "string",
              description: "Existing plan content (for re-estimation)",
            },
            complexity: {
              type: "string",
              enum: ["basic", "intermediate", "advanced"],
              description: "Project complexity level",
            },
            features: {
              type: "array",
              items: { type: "string" },
              description: "List of features to estimate",
            },
            similarProjects: {
              type: "array",
              items: { type: "string" },
              description: "Names of similar projects to learn from",
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Tool handler implementations will go here
  // For now, return placeholder responses

  switch (name) {
    case "conductDiscovery":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "conductDiscovery tool - implementation pending",
              params: args,
            }, null, 2),
          },
        ],
      };

    case "analyzeRequirements":
      const analyzeResult = await analyzeRequirements(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analyzeResult, null, 2),
          },
        ],
      };

    case "generateProjectPlan":
      const result = await generateProjectPlan(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };

    case "critiquePlan":
      const critiqueResult = await critiquePlan(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(critiqueResult, null, 2),
          },
        ],
      };

    case "setupGitHubProject":
      const setupResult = await setupGitHubProject(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(setupResult, null, 2),
          },
        ],
      };

    case "syncWithGitHub":
      const syncResult = await syncWithGitHub(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(syncResult, null, 2),
          },
        ],
      };

    case "trackProgress":
      const progressResult = await trackProgress(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(progressResult, null, 2),
          },
        ],
      };

    case "updateSessionStatus":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "updateSessionStatus tool - implementation pending",
              params: args,
            }, null, 2),
          },
        ],
      };

    case "findNextSession":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "findNextSession tool - implementation pending",
              params: args,
            }, null, 2),
          },
        ],
      };

    case "reviewArchitecture":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "reviewArchitecture tool - implementation pending",
              params: args,
            }, null, 2),
          },
        ],
      };

    case "estimateEffort":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "estimateEffort tool - implementation pending",
              params: args,
            }, null, 2),
          },
        ],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// ============================================================================
// RESOURCE REGISTRATION
// ============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "project://list",
        name: "All Projects",
        description: "List all projects tracked by the planner",
        mimeType: "application/json",
      },
      {
        uri: "template://list",
        name: "Available Templates",
        description: "List all available project templates",
        mimeType: "application/json",
      },
      {
        uri: "pattern://list",
        name: "Best Practices Patterns",
        description: "List all recognized patterns and best practices",
        mimeType: "application/json",
      },
      {
        uri: "metrics://all",
        name: "Historical Metrics",
        description: "Aggregated metrics from all past projects",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  // Resource handler implementations will go here
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify({
          message: "Resource handler - implementation pending",
          uri,
        }, null, 2),
      },
    ],
  };
});

// ============================================================================
// PROMPT REGISTRATION
// ============================================================================

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "discovery-questions",
        description: "Generate intelligent discovery questions for project planning",
        arguments: [
          {
            name: "projectType",
            description: "Type of project",
            required: true,
          },
          {
            name: "previousAnswers",
            description: "Previous answers for follow-up questions",
            required: false,
          },
        ],
      },
      {
        name: "architecture-review",
        description: "Generate comprehensive architecture review prompt",
        arguments: [
          {
            name: "plan",
            description: "Project plan content",
            required: true,
          },
          {
            name: "requirements",
            description: "Requirements content",
            required: true,
          },
          {
            name: "focus",
            description: "Focus area (backend, frontend, mobile, all)",
            required: false,
          },
        ],
      },
      {
        name: "estimate-effort",
        description: "Generate effort estimation prompt with historical context",
        arguments: [
          {
            name: "requirements",
            description: "Requirements content",
            required: true,
          },
          {
            name: "complexity",
            description: "Project complexity level",
            required: true,
          },
          {
            name: "similarProjects",
            description: "Similar projects for reference",
            required: false,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Prompt handler implementations will go here
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Prompt: ${name} - implementation pending\nArguments: ${JSON.stringify(args, null, 2)}`,
        },
      },
    ],
  };
});

// ============================================================================
// START SERVER
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Project Planner MCP Server v1.0.0 running on stdio");
  console.error("Tools: 11 | Resources: 4 | Prompts: 3");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
