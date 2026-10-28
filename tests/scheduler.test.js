const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

let scheduler, tasks, notifications, intervals, cleared;
const NOW = Date.parse('2026-10-28T12:00:00Z');
const at = minutes => new Date(NOW + minutes * 60000).toISOString();
beforeEach(() => {
  tasks = [];
  notifications = [];
  intervals = [];
  cleared = [];
  const module = { exports: {} };
  class Clock extends Date { static now() { return NOW; } }
  class Notification {
    static isSupported() { return true; }
    constructor(options) { this.options = options; }
    show() { notifications.push(this.options); }
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/main/scheduler.js'), 'utf8'), {
    module, __dirname: path.join(__dirname, '../src/main'), Date: Clock,
    setInterval(callback) { intervals.push(callback); return intervals.length; },
    clearInterval(id) { cleared.push(id); },
    require(name) { return name === 'electron' ? { Notification } : require(name); },
  });
  scheduler = new module.exports({ getTasks: () => tasks });
});

test('an upcoming task is notified once across repeated checks', () => {
  tasks.push({ id: 'a', text: 'Call', exactTime: at(20) });
  scheduler.checkTasks();
  scheduler.checkTasks();
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].body, 'Call');
});

test('rescheduling the same task allows a reminder for its new time', () => {
  tasks.push({ id: 'a', text: 'Call', exactTime: at(20) });
  scheduler.checkTasks();
  tasks[0].exactTime = at(25);
  scheduler.checkTasks();
  scheduler.checkTasks();
  assert.equal(notifications.length, 2);
});

test('rescheduling outside the window waits until a later eligible time', () => {
  tasks.push({ id: 'a', text: 'Call', exactTime: at(20) });
  scheduler.checkTasks();
  tasks[0].exactTime = at(60);
  scheduler.checkTasks();
  assert.equal(notifications.length, 1);
  tasks[0].exactTime = at(30);
  scheduler.checkTasks();
  assert.equal(notifications.length, 2);
});

test('equivalent timestamp spellings do not cause duplicate reminders', () => {
  tasks.push({ id: 'a', text: 'Call', exactTime: at(20) });
  scheduler.checkTasks();
  tasks[0].exactTime = '2026-10-28T12:20:00+00:00';
  scheduler.checkTasks();
  assert.equal(notifications.length, 1);
});

test('completed, past, invalid and distant tasks are not notified', () => {
  tasks.push(
    { id: 'done', text: 'Done', exactTime: at(10), completed: true },
    { id: 'past', text: 'Past', exactTime: at(-1) },
    { id: 'invalid', text: 'Invalid', exactTime: 'bad-date' },
    { id: 'distant', text: 'Later', exactTime: at(31) },
    { id: 'untimed', text: 'Someday' },
  );
  scheduler.checkTasks();
  assert.equal(notifications.length, 0);
});

test('deleted tasks release reminder tracking', () => {
  tasks.push({ id: 'a', text: 'Call', exactTime: at(20) });
  scheduler.checkTasks();
  tasks = [];
  scheduler.checkTasks();
  assert.equal(scheduler.notifiedTaskTimes.size, 0);
});

test('starting twice keeps one interval and stopping clears it', () => {
  scheduler.start();
  scheduler.start();
  assert.equal(intervals.length, 1);
  scheduler.stop();
  scheduler.stop();
  assert.deepEqual(cleared, [1]);
  scheduler.start();
  assert.equal(intervals.length, 2);
});
