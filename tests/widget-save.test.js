const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the actual renderer save handler with a minimal DOM and mocked IPC.
function widget(saveTask) {
  const source = fs.readFileSync(path.join(__dirname, '../src/renderer/widget.html'), 'utf8');
  const handler = source.match(/btnConfirm.addEventListener\('click', async \(\) => \{([\s\S]*?)\n  \}\);/)[1];
  const validate = source.match(/function validateConfirm\(\) \{([^\n]*)\}/)[1];
  const state = { isSaving: false, selectedDate: '2026-10-30', selectedExactTime: null,
    confirmText: { value: 'Keep my task' }, errorMsg: { textContent: '' },
    btnConfirm: { disabled: false, textContent: 'Save Task' },
    window: { quickDo: { saveTask } }, isCalendarOpen: false,
    closeConfirmDialog() { state.closed = true; }, renderCalendar() {}, closed: false };
  vm.createContext(state);
  vm.runInContext(`function validateConfirm() {${validate}}; async function save() {${handler}}`, state);
  return state;
}

test('rejected IPC preserves the task, shows a retry error and allows a second save', async () => {
  let calls = 0;
  const ui = widget(async () => { if (++calls === 1) throw new Error('IPC disconnected'); return { success: true }; });
  await assert.doesNotReject(() => ui.save());
  assert.equal(ui.confirmText.value, 'Keep my task');
  assert.equal(ui.selectedDate, '2026-10-30');
  assert.match(ui.errorMsg.textContent, /Try again/);
  assert.equal(ui.btnConfirm.textContent, 'Save Task');
  assert.equal(ui.btnConfirm.disabled, false);
  assert.equal(ui.isSaving, false);
  assert.equal(ui.closed, false);
  await ui.save();
  assert.equal(calls, 2);
  assert.equal(ui.closed, true);
});

test('store-reported failure keeps its error and permits retry', async () => {
  const ui = widget(async () => ({ success: false, error: 'Disk full' }));
  await ui.save();
  assert.equal(ui.errorMsg.textContent, 'Disk full');
  assert.equal(ui.isSaving, false);
  assert.equal(ui.btnConfirm.disabled, false);
  assert.equal(ui.closed, false);
});

test('pending save stays disabled when validation runs and ignores duplicate clicks', async () => {
  let finish, calls = 0;
  const ui = widget(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
  const pending = ui.save();
  ui.validateConfirm();
  assert.equal(ui.btnConfirm.disabled, true);
  await ui.save();
  assert.equal(calls, 1);
  finish({ success: true });
  await pending;
  assert.equal(ui.closed, true);
  assert.equal(ui.isSaving, false);
});

test('cleared input stays disabled after an unsuccessful pending save', async () => {
  let finish;
  const ui = widget(() => new Promise(resolve => { finish = resolve; }));
  const pending = ui.save();
  ui.confirmText.value = '';
  finish({ success: false, error: 'Disk full' });
  await pending;
  assert.equal(ui.btnConfirm.disabled, true);
  assert.equal(ui.closed, false);
});
