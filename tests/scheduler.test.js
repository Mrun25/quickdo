const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

let scheduler, tasks, notifications, intervals, cleared, supported, failNext, errors;
const NOW = Date.parse('2026-10-28T12:00:00Z');
const at = minutes => new Date(NOW + minutes * 60000).toISOString();
beforeEach(() => {
  tasks = [];
  notifications = [];
  intervals = [];
  cleared = [];
  supported = true;
  failNext = false;
  errors = [];
  const module = { exports: {} };
  class Clock extends Date { static now() { return NOW; } }
  class Notification {
    static isSupported() { return supported; }
    constructor(options) { this.options = options; }
    show() {
      if (failNext) { failNext = false; throw new Error('Notification unavailable'); }
      notifications.push(this.options);
    }
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/main/scheduler.js'), 'utf8'), {
    module, __dirname: path.join(__dirname, '../src/main'), Date: Clock,
    console: { error(...args) { errors.push(args); } },
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


test('temporarily unsupported notifications do not consume the reminder', () => {
  tasks.push({ id: 'a', text: 'Call', exactTime: at(20) });
  supported = false;
  scheduler.checkTasks();
  assert.equal(scheduler.notifiedTaskTimes.size, 0);
  supported = true;
  scheduler.checkTasks();
  scheduler.checkTasks();
  assert.equal(notifications.length, 1);
});

test('a failed notification is retried without blocking other due tasks', () => {
  tasks.push(
    { id: 'a', text: 'First', exactTime: at(20) },
    { id: 'b', text: 'Second', exactTime: at(20) },
  );
  failNext = true;
  assert.doesNotThrow(() => scheduler.checkTasks());
  assert.deepEqual(notifications.map(n => n.body), ['Second']);
  assert.equal(scheduler.notifiedTaskTimes.has('a'), false);
  scheduler.checkTasks();
  scheduler.checkTasks();
  assert.deepEqual(notifications.map(n => n.body), ['Second', 'First']);
  assert.equal(errors.length, 1);
});

test('notification submission reports whether it was accepted', () => {
  supported = false;
  assert.equal(scheduler.sendNotification('Test', 'Body'), false);
  supported = true;
  assert.equal(scheduler.sendNotification('Test', 'Body'), true);
  failNext = true;
  assert.equal(scheduler.sendNotification('Test', 'Body'), false);
});
