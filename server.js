'use strict';
const express = require('express');
const initSqlJs = require('sql.js');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const dbPath = path.join(__dirname, 'taskflow.sqlite');
let db;
function persist() { fs.writeFileSync(dbPath, Buffer.from(db.export())); }
function rows(sql, params = []) {
  const stmt = db.prepare(sql);
  try { stmt.bind(params); const out=[]; while(stmt.step()) out.push(stmt.getAsObject()); return out; }
  finally { stmt.free(); }
}
function one(sql, params = []) { return rows(sql, params)[0] || null; }
function run(sql, params = []) {
  db.run(sql, params);
  const changes = db.getRowsModified();
  const id = one('SELECT last_insert_rowid() AS id')?.id ?? null;
  persist();
  return { changes, lastInsertRowid: id };
}
const allowedPriorities = ['Low','Medium','High'];
const allowedCategories = ['Work','Personal','Learning','Design','Development','Other'];
function clean(body, existing = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('Invalid task data');
  const t = {
    title: body.title === undefined ? existing.title : body.title,
    description: body.description === undefined ? (existing.description ?? '') : body.description,
    priority: body.priority === undefined ? (existing.priority ?? 'Medium') : body.priority,
    completed: body.completed === undefined ? (existing.completed ?? 0) : body.completed,
    due_date: body.due_date === undefined ? (existing.due_date ?? '') : body.due_date,
    category: body.category === undefined ? (existing.category ?? 'Work') : body.category
  };
  if (typeof t.title !== 'string' || !t.title.trim() || t.title.trim().length > 120 ||
      typeof t.description !== 'string' || t.description.length > 500 ||
      !allowedPriorities.includes(t.priority) || ![0,1,true,false].includes(t.completed) ||
      typeof t.due_date !== 'string' || (t.due_date !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(t.due_date)) ||
      !allowedCategories.includes(t.category)) throw Error('Invalid task data');
  if (t.due_date && (!Number.isFinite(Date.parse(t.due_date+'T00:00:00Z')) || new Date(t.due_date+'T00:00:00Z').toISOString().slice(0,10)!==t.due_date)) throw Error('Invalid due date');
  t.title = t.title.trim(); t.description = t.description.trim(); t.completed = Number(t.completed);
  return t;
}
function idOf(req) { const n=Number(req.params.id); return Number.isSafeInteger(n)&&n>0?n:null; }

(async () => {
  const SQL = await initSqlJs({ locateFile: file => require.resolve('sql.js/dist/' + file) });
  db = fs.existsSync(dbPath) ? new SQL.Database(new Uint8Array(fs.readFileSync(dbPath))) : new SQL.Database();
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'Medium', completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, due_date TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Work', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  persist();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(rateLimit({ windowMs: 60*1000, limit: 240, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.use(express.json({ limit: '16kb' }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/api/health', (req,res) => res.json({ok:true, service:'TaskFlow Pro local API', database:'SQLite'}));
  app.get('/api/tasks', (req,res) => res.json(rows('SELECT * FROM tasks ORDER BY id DESC')));
  app.post('/api/tasks', (req,res) => {
    try {
      const t=clean(req.body);
      const r=run('INSERT INTO tasks(title,description,priority,completed,due_date,category) VALUES(?,?,?,?,?,?)',[t.title,t.description,t.priority,t.completed,t.due_date,t.category]);
      res.status(201).json(one('SELECT * FROM tasks WHERE id=?',[r.lastInsertRowid]));
    } catch(e) { res.status(400).json({error:e.message}); }
  });
  app.patch('/api/tasks/:id', (req,res) => {
    const id=idOf(req); if(!id) return res.status(400).json({error:'Invalid ID'});
    const old=one('SELECT * FROM tasks WHERE id=?',[id]); if(!old) return res.status(404).json({error:'Task not found'});
    try {
      const t=clean(req.body,old);
      run("UPDATE tasks SET title=?,description=?,priority=?,completed=?,due_date=?,category=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",[t.title,t.description,t.priority,t.completed,t.due_date,t.category,id]);
      res.json(one('SELECT * FROM tasks WHERE id=?',[id]));
    } catch(e) { res.status(400).json({error:e.message}); }
  });
  app.delete('/api/tasks/:id', (req,res) => {
    const id=idOf(req); if(!id) return res.status(400).json({error:'Invalid ID'});
    const old=one('SELECT id FROM tasks WHERE id=?',[id]); if(!old) return res.status(404).json({error:'Task not found'});
    run('DELETE FROM tasks WHERE id=?',[id]); res.status(204).end();
  });
  app.use('/api', (req,res) => res.status(404).json({error:'API route not found'}));
  app.use((err,req,res,next) => res.status(400).json({error:'Malformed request'}));
  const port=Number(process.env.PORT)||3001;
  app.listen(port,'127.0.0.1',()=>console.log(`TaskFlow Pro ready: http://127.0.0.1:${port}`));
})().catch(err => { console.error('TaskFlow Pro startup failed:', err); process.exit(1); });
