#!/usr/bin/env node
/*
 * sync-claude — generate the loadable .claude/ assets from the top-level sources.
 *
 * SOURCES (committed, versioned):
 *   agents/<name>/prompt.md   → .claude/agents/<name>.md
 *   skills/<name>/SKILL.md     → .claude/skills/<name>/SKILL.md
 *
 * .claude/agents and .claude/skills are GENERATED (gitignored) — Claude Code only loads
 * from .claude/, so this is the bridge between "agents are versioned AI Assets" and
 * "Claude Code can run them." Run: `npm run sync:claude`.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rm = (p) => fs.existsSync(p) && fs.rmSync(p, { recursive: true, force: true });
const dirs = (p) => (fs.existsSync(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []);

// --- agents ---
const agentSrc = path.join(root, 'agents');
const agentOut = path.join(root, '.claude', 'agents');
rm(agentOut);
fs.mkdirSync(agentOut, { recursive: true });
let a = 0;
for (const name of dirs(agentSrc)) {
  const prompt = path.join(agentSrc, name, 'prompt.md');
  if (!fs.existsSync(prompt)) continue;
  fs.writeFileSync(path.join(agentOut, `${name}.md`), fs.readFileSync(prompt, 'utf8'));
  a++;
}

// --- skills ---
const skillSrc = path.join(root, 'skills');
const skillOut = path.join(root, '.claude', 'skills');
rm(skillOut);
fs.mkdirSync(skillOut, { recursive: true });
let s = 0;
for (const name of dirs(skillSrc)) {
  const skill = path.join(skillSrc, name, 'SKILL.md');
  if (!fs.existsSync(skill)) continue;
  fs.mkdirSync(path.join(skillOut, name), { recursive: true });
  fs.writeFileSync(path.join(skillOut, name, 'SKILL.md'), fs.readFileSync(skill, 'utf8'));
  s++;
}

console.log(`sync-claude: ${a} agents → .claude/agents, ${s} skills → .claude/skills`);
