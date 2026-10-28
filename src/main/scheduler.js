// src/main/scheduler.js
// Background task scheduler for native OS notifications

const { Notification } = require('electron');

class Scheduler {
  constructor(store) {
    this.store = store;
    this.notifiedTaskTimes = new Map();
    this.intervalId = null;
  }

  start() {
    if (this.intervalId !== null) return;
    // Run every minute
    this.intervalId = setInterval(() => this.checkTasks(), 60000);
    // Do an initial check
    this.checkTasks();
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  checkTasks() {
    const tasks = this.store.getTasks();
    const now = Date.now();
    const THIRTY_MINS = 30 * 60 * 1000;

    const currentIds = new Set(tasks.map(task => task.id));
    for (const id of this.notifiedTaskTimes.keys()) {
      if (!currentIds.has(id)) this.notifiedTaskTimes.delete(id);
    }

    tasks.forEach(task => {
      if (task.completed || !task.exactTime) return;
      const taskTime = new Date(task.exactTime).getTime();
      // Editing a due time must not suppress its new reminder. Compare the
      // instant rather than the timestamp spelling to avoid duplicates.
      if (this.notifiedTaskTimes.get(task.id) === taskTime) return;
      const timeDiff = taskTime - now;

      // Notify future tasks within 30 minutes; tracking prevents repeats.
      if (timeDiff > 0 && timeDiff <= THIRTY_MINS) {
        this.sendNotification('Upcoming Task in 30 mins', task.text);
        this.notifiedTaskTimes.set(task.id, taskTime);
      }
    });
  }

  triggerStartupSummary() {
    const tasks = this.store.getTasks();
    const todayStr = this._toDateStr(new Date());
    
    const todaysTasks = tasks.filter(t => !t.completed && t.date === todayStr);
    
    if (todaysTasks.length > 0) {
      const hour = new Date().getHours();
      let greeting = 'Good Morning!';
      if (hour >= 12 && hour < 17) greeting = 'Good Afternoon!';
      else if (hour >= 17) greeting = 'Good Evening!';

      this.sendNotification(
        greeting, 
        `You have ${todaysTasks.length} task(s) scheduled for today.`
      );
    }
  }

  sendNotification(title, body) {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        body,
        icon: require('path').join(__dirname, '../../assets/icon.png')
      });
      notification.show();
    }
  }

  _toDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

module.exports = Scheduler;
