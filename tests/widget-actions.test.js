const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
  const source = fs.readFileSync(path.join(__dirname, '../src/renderer/widget.html'), 'utf8');
  const helper = source.slice(source.indexOf('  async function applyTaskAction('), source.indexOf('  function renderDayView('));
  const buttons = [{ disabled: false }, { disabled: false }];
  const item = { dataset: {}, error: null, querySelectorAll: () => buttons,
    querySelector: () => item.error,
    appendChild(error) { item.error = error; error.remove = () => { item.error = null; }; } };
  const ui = { document: { createElement: () => ({ setAttribute() {} }) }, refreshed: 0,
    getTasksForDate: async () => [{ id: 'kept' }],
    renderCalendar: async () => { ui.refreshed++; },
    openDayView: (date, tasks) => { ui.opened = { date, tasks }; } };
  vm.createContext(ui);
  vm.runInContext(helper, ui);
  return { ui, item, buttons };
}

for (const mode of ['reject', 'failure-result', 'missing-result']) {
  test(`task action ${mode} keeps row, reports error and allows retry`, async () => {
    const { ui, item, buttons } = setup();
    await assert.doesNotReject(() => ui.applyTaskAction(item, '2026-10-30', async () => {
      if (mode === 'reject') throw new Error('Disk full');
      return mode === 'failure-result' ? { success: false } : undefined;
    }));
    assert.match(item.error.textContent, /Try again/);
    assert.equal(ui.refreshed, 0);
    assert.equal(item.dataset.pending, undefined);
    assert.ok(buttons.every(button => !button.disabled));
    await ui.applyTaskAction(item, '2026-10-30', async () => ({ success: true }));
    assert.equal(item.error, null);
    assert.equal(ui.refreshed, 1);
    assert.equal(ui.opened.date, '2026-10-30');
  });
}

test('pending change disables both controls and ignores duplicate actions', async () => {
  const { ui, item, buttons } = setup();
  let finish, calls = 0;
  const action = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const pending = ui.applyTaskAction(item, '2026-10-30', action);
  assert.ok(buttons.every(button => button.disabled));
  await ui.applyTaskAction(item, '2026-10-30', action);
  assert.equal(calls, 1);
  finish({ success: true });
  await pending;
  assert.ok(buttons.every(button => !button.disabled));
  assert.equal(ui.refreshed, 1);
});

test('completion and deletion both use the protected action path', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/renderer/widget.html'), 'utf8');
  assert.match(source, /applyTaskAction\(item, dateStr, \(\) => window.quickDo.updateTask/);
  assert.match(source, /applyTaskAction\(item, dateStr, \(\) => window.quickDo.deleteTask/);
});

test('refresh failure is distinct from a rejected save', async () => {
  const { ui, item } = setup();
  ui.getTasksForDate = async () => { throw new Error('Read failed'); };
  await assert.doesNotReject(() => ui.applyTaskAction(item, '2026-10-30', async () => ({ success: true })));
  assert.match(item.error.textContent, /Change saved/);
  assert.equal(ui.refreshed, 0);
});
