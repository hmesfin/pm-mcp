// src/database/schema.ts
// SQLite database schema for cross-project intelligence

import Database from "better-sqlite3";

export interface DBSchema {
  projects: {
    id: number;
    name: string;
    type: string;
    complexity: string;
    created_at: number;
    completed_at?: number;
    plan_path: string;
    state_path: string;
    github_owner?: string;
    github_repo?: string;
  };

  sessions: {
    id: number;
    project_id: number;
    session_number: number;
    title: string;
    phase: number;
    domain: string;
    status: string;
    estimated_time: string;
    actual_time?: string;
    tests_written: number;
    tests_passing: number;
    coverage: number;
    started_at?: number;
    completed_at?: number;
    github_issue?: number;
    github_pr?: number;
  };

  patterns: {
    id: number;
    name: string;
    category: string;
    subcategory: string;
    description: string;
    when_to_use: string;
    example_code: string;
    example_language: string;
    usage_count: number;
    success_count: number;
  };

  metrics: {
    id: number;
    project_id: number;
    metric_type: string;
    metric_value: number;
    metric_unit: string;
    recorded_at: number;
  };

  learnings: {
    id: number;
    project_id: number;
    category: string;
    title: string;
    description: string;
    impact: string;
    created_at: number;
  };
}

export function initializeDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      complexity TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      completed_at INTEGER,
      plan_path TEXT NOT NULL,
      state_path TEXT NOT NULL,
      github_owner TEXT,
      github_repo TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      session_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      phase INTEGER NOT NULL,
      domain TEXT NOT NULL,
      status TEXT NOT NULL,
      estimated_time TEXT NOT NULL,
      actual_time TEXT,
      tests_written INTEGER DEFAULT 0,
      tests_passing INTEGER DEFAULT 0,
      coverage REAL DEFAULT 0,
      started_at INTEGER,
      completed_at INTEGER,
      github_issue INTEGER,
      github_pr INTEGER,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      UNIQUE(project_id, session_number)
    );

    CREATE TABLE IF NOT EXISTS patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      description TEXT NOT NULL,
      when_to_use TEXT NOT NULL,
      example_code TEXT NOT NULL,
      example_language TEXT NOT NULL,
      usage_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      metric_type TEXT NOT NULL,
      metric_value REAL NOT NULL,
      metric_unit TEXT NOT NULL,
      recorded_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS learnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      impact TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_domain ON sessions(domain);
    CREATE INDEX IF NOT EXISTS idx_metrics_project ON metrics(project_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(metric_type);
    CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(category);
    CREATE INDEX IF NOT EXISTS idx_learnings_project ON learnings(project_id);
    CREATE INDEX IF NOT EXISTS idx_learnings_category ON learnings(category);
  `);

  return db;
}

// Helper functions for common queries

export function getProjectByName(db: Database.Database, name: string): DBSchema["projects"] | undefined {
  return db.prepare("SELECT * FROM projects WHERE name = ?").get(name) as DBSchema["projects"] | undefined;
}

export function createProject(db: Database.Database, project: Omit<DBSchema["projects"], "id">): number {
  const result = db.prepare(`
    INSERT INTO projects (name, type, complexity, created_at, plan_path, state_path, github_owner, github_repo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    project.name,
    project.type,
    project.complexity,
    project.created_at,
    project.plan_path,
    project.state_path,
    project.github_owner || null,
    project.github_repo || null
  );
  return result.lastInsertRowid as number;
}

export function getSessionsByProject(db: Database.Database, projectId: number): DBSchema["sessions"][] {
  return db.prepare("SELECT * FROM sessions WHERE project_id = ? ORDER BY session_number").all(projectId) as DBSchema["sessions"][];
}

export function upsertSession(db: Database.Database, session: Omit<DBSchema["sessions"], "id">): void {
  db.prepare(`
    INSERT INTO sessions (
      project_id, session_number, title, phase, domain, status,
      estimated_time, actual_time, tests_written, tests_passing, coverage,
      started_at, completed_at, github_issue, github_pr
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id, session_number) DO UPDATE SET
      status = excluded.status,
      actual_time = excluded.actual_time,
      tests_written = excluded.tests_written,
      tests_passing = excluded.tests_passing,
      coverage = excluded.coverage,
      started_at = excluded.started_at,
      completed_at = excluded.completed_at,
      github_issue = excluded.github_issue,
      github_pr = excluded.github_pr
  `).run(
    session.project_id,
    session.session_number,
    session.title,
    session.phase,
    session.domain,
    session.status,
    session.estimated_time,
    session.actual_time || null,
    session.tests_written,
    session.tests_passing,
    session.coverage,
    session.started_at || null,
    session.completed_at || null,
    session.github_issue || null,
    session.github_pr || null
  );
}

export function getPatterns(db: Database.Database, category?: string): DBSchema["patterns"][] {
  if (category) {
    return db.prepare("SELECT * FROM patterns WHERE category = ? ORDER BY usage_count DESC").all(category) as DBSchema["patterns"][];
  }
  return db.prepare("SELECT * FROM patterns ORDER BY usage_count DESC").all() as DBSchema["patterns"][];
}

export function incrementPatternUsage(db: Database.Database, patternName: string, success: boolean): void {
  if (success) {
    db.prepare("UPDATE patterns SET usage_count = usage_count + 1, success_count = success_count + 1 WHERE name = ?").run(patternName);
  } else {
    db.prepare("UPDATE patterns SET usage_count = usage_count + 1 WHERE name = ?").run(patternName);
  }
}

export function recordMetric(db: Database.Database, metric: Omit<DBSchema["metrics"], "id">): void {
  db.prepare(`
    INSERT INTO metrics (project_id, metric_type, metric_value, metric_unit, recorded_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    metric.project_id,
    metric.metric_type,
    metric.metric_value,
    metric.metric_unit,
    metric.recorded_at
  );
}

export function addLearning(db: Database.Database, learning: Omit<DBSchema["learnings"], "id">): void {
  db.prepare(`
    INSERT INTO learnings (project_id, category, title, description, impact, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    learning.project_id,
    learning.category,
    learning.title,
    learning.description,
    learning.impact,
    learning.created_at
  );
}
