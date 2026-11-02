const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

let dir, store, handlers;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quickdo-identity-'));
  const electron = {
    app: { getPath: () => dir, whenReady: () => ({ then() {} }), on() {} },
    ipcMain: { on() {}, handle(name, callback) { handlers[name] = callback; } },
  };
  handlers = {};
  const storeModule = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/main/store.js'), 'utf8'), {
    module: storeModule, console,
    require(name) { return name === 'electron' ? electron : require(name); },
  });
  class Clock extends Date { static now() { return 1793638800000; } }
  class TestStore extends storeModule.exports { constructor() { super(); store = this; } }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/main/main.js'), 'utf8'), {
    __dirname: path.join(__dirname, '../src/main'), console, Date: Clock,
    require(name) {
      if (name === 'electron') return electron;
      if (name === './store') return TestStore;
      if (name === './dateParser') return {};
      if (name === './scheduler') return class {};
      return require(name);
    },
  });
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

async function savePair() {
  const save = text => handlers['save-task'](null, { text, date: '2026-11-03' });
  const first = await save('First task');
  const second = await save('Second task');
  assert.equal(first.success, true);
  assert.equal(second.success, true);
  return [first.task, second.task];
}

test('tasks saved in the same millisecond have distinct persistent ids', async () => {
  const [first, second] = await savePair();
  assert.notEqual(first.id, second.id);
  const saved = JSON.parse(fs.readFileSync(path.join(dir, 'tasks.json'), 'utf8'));
  assert.deepEqual(saved.map(task => task.id), [first.id, second.id]);
});

test('completing the second rapid save does not complete the first task', async () => {
  const [, second] = await savePair();
  await handlers['update-task'](null, { id: second.id, completed: true });
  const saved = store.getTasks();
  assert.equal(saved[0].completed, false);
  assert.equal(saved[1].completed, true);
});

test('deleting one rapid save keeps the other task', async () => {
  const [first, second] = await savePair();
  await handlers['delete-task'](null, second.id);
  assert.equal(store.getTasks().length, 1);
  assert.equal(store.getTasks()[0].id, first.id);
});

test('legacy timestamp ids remain editable and deletable', async () => {
  store.addTask({ id: '1700000000000', text: 'Legacy', completed: false });
  await handlers['update-task'](null, { id: '1700000000000', completed: true });
  assert.equal(store.getTasks()[0].completed, true);
  await handlers['delete-task'](null, '1700000000000');
  assert.equal(store.getTasks().length, 0);
});
