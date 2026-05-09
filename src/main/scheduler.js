// src/main/scheduler.js
// Background task scheduler for native OS notifications

const { Notification } = require('electron');

class Scheduler {
  constructor(store) {
    this.store = store;
    this.notifiedTaskIds = new Set();
    this.intervalId = null;
  }

  start() {
    // Run every minute
    this.intervalId = setInterval(() => this.checkTasks(), 60000);
    // Do an initial check
    this.checkTasks();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  checkTasks() {
    const tasks = this.store.getTasks();
    const now = Date.now();
    const THIRTY_MINS = 30 * 60 * 1000;

    tasks.forEach(task => {
      if (task.completed || !task.exactTime) return;
      if (this.notifiedTaskIds.has(task.id)) return;

      const taskTime = new Date(task.exactTime).getTime();
      const timeDiff = taskTime - now;

      // If task is in the future, and within 30 minutes (and more than 29 minutes to avoid double triggers if setInterval drifts, though Set handles it)
      // Actually we just check if timeDiff is between 0 and 30 minutes
      if (timeDiff > 0 && timeDiff <= THIRTY_MINS) {
        this.sendNotification('Upcoming Task in 30 mins', task.text);
        this.notifiedTaskIds.add(task.id);
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
