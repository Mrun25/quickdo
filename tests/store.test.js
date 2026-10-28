const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

let dir, store;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quickdo-store-'));
  const module = { exports: {} };
  const sandbox = {
    module, console, process,
    require(name) {
      if (name === 'electron') return { app: { getPath: () => dir } };
      return require(name);
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/main/store.js'), 'utf8'), sandbox);
  store = new module.exports();
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

function tasksFile() { return path.join(dir, 'tasks.json'); }
function readTasks() { return JSON.parse(fs.readFileSync(tasksFile(), 'utf8')); }

test('normal add, update, delete preserves other task fields', () => {
  store.addTask({ id: 'a', text: 'one', completed: false });
  store.addTask({ id: 'b', text: 'two' });
  store.updateTask({ id: 'a', completed: true });
  assert.deepEqual(readTasks(), [{ id: 'a', text: 'one', completed: true }, { id: 'b', text: 'two' }]);
  store.deleteTask('b');
  assert.equal(readTasks().length, 1);
});

for (const broken of ['{truncated', '{}', 'null', '"not a list"']) {
  for (const operation of ['addTask', 'updateTask', 'deleteTask']) {
    test(`${operation} refuses damaged/non-list JSON: ${broken}`, () => {
      fs.writeFileSync(tasksFile(), broken);
      assert.throws(() => store[operation]({ id: 'a', text: 'new' }));
      assert.equal(fs.readFileSync(tasksFile(), 'utf8'), broken);
    });
  }
}

test('failed replacement leaves original JSON and removes temporary file', () => {
  store.addTask({ id: 'a', text: 'original' });
  const before = fs.readFileSync(tasksFile(), 'utf8');
  const originalRename = fs.renameSync;
  fs.renameSync = () => { throw new Error('simulated disk error'); };
  try { assert.throws(() => store.addTask({ id: 'b' }), /simulated disk error/); }
  finally { fs.renameSync = originalRename; }
  assert.equal(fs.readFileSync(tasksFile(), 'utf8'), before);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['settings.json', 'tasks.json']);
});

test('settings survive a failed replacement', () => {
  store.set('theme', 'dark');
  const before = fs.readFileSync(path.join(dir, 'settings.json'), 'utf8');
  const originalRename = fs.renameSync;
  fs.renameSync = () => { throw new Error('simulated disk error'); };
  try { store.set('theme', 'light'); }
  finally { fs.renameSync = originalRename; }
  assert.equal(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'), before);
});

test('partial staging write leaves the original tasks readable', () => {
  store.addTask({ id: 'a', text: 'original' });
  const before = fs.readFileSync(tasksFile(), 'utf8');
  const originalWrite = fs.writeFileSync;
  fs.writeFileSync = (file, ...args) => {
    if (String(file).endsWith('.tmp')) {
      originalWrite(file, '{partial');
      throw new Error('disk full');
    }
    return originalWrite(file, ...args);
  };
  try { assert.throws(() => store.addTask({ id: 'b' }), /disk full/); }
  finally { fs.writeFileSync = originalWrite; }
  assert.equal(fs.readFileSync(tasksFile(), 'utf8'), before);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['settings.json', 'tasks.json']);
});

test('packaged source has no bundled Groq credential', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/main/main.js'), 'utf8');
  assert.equal(/gsk_[A-Za-z0-9]/.test(source), false);
  assert.ok(source.includes("return ''; // No shared credential"));
});

for (const broken of ['{truncated', '{}', 'null', '"not a list"', '42']) {
  test(`reading damaged/non-list storage returns a safe empty task list: ${broken}`, () => {
    fs.writeFileSync(tasksFile(), broken);
    const tasks = store.getTasks();
    assert.equal(Array.isArray(tasks), true);
    assert.equal(tasks.length, 0);
    assert.equal(fs.readFileSync(tasksFile(), 'utf8'), broken);
    assert.throws(() => store.addTask({ id: 'new', text: 'Do not overwrite' }));
    assert.equal(fs.readFileSync(tasksFile(), 'utf8'), broken);
  });
}

test('reading valid tasks does not change their contents or file', () => {
  const original = '[{"id":"a","text":"Keep me","completed":false}]';
  fs.writeFileSync(tasksFile(), original);
  assert.equal(JSON.stringify(store.getTasks()), original);
  assert.equal(fs.readFileSync(tasksFile(), 'utf8'), original);
});
