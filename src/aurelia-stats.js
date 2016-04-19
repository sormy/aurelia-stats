import $ from 'jquery';
import {ObserverLocator} from 'aurelia-framework';

class AureliaStatsPlugin {
  threshold = 100; 
  interval = 1000; 
  warnLevel = 0.6;
  debugDirtyChecker = false;

  frameworkConfiguration;

  observerLocator;

  rootEl;
  graphEl;
  graphCtx;
  statsEl;
  dcValueEl;
  mtValueEl;
  rtValueEl;
  sumValueEl;

  width;
  height;
  textHeight;
  canvasHeight;
  lineWidth;

  currentStats;

  static configure(frameworkConfiguration, pluginConfiguration) {
    new AureliaStatsPlugin(frameworkConfiguration, pluginConfiguration);
  }

  constructor(frameworkConfiguration, pluginConfiguration) {
    this.frameworkConfiguration = frameworkConfiguration;

    if (pluginConfiguration) {
      if (pluginConfiguration.threshold) {
        this.threshold = pluginConfiguration.threshold;
      }
      if (pluginConfiguration.interval) {
        this.interval = pluginConfiguration.interval;
      }
      if (pluginConfiguration.warnLevel) {
        this.warnLevel = pluginConfiguration.warnLevel;
      }
      if (pluginConfiguration.debugDirtyChecker) {
        this.debugDirtyChecker = pluginConfiguration.debugDirtyChecker;
      }
    }

    this.observerLocator = frameworkConfiguration.container.get(ObserverLocator);

    this.attach();
  }

  attach() {
    $(this.attached.bind(this));
  }

  attached() {
    this.patchDirtyChecker();
    this.patchTaskQueue();
    this.createElement();
    this.initElement();
    this.resize();
    this.scheduleTask();
  }

  createElement() {
    this.rootEl = $(`
      <div class="au-stats">
        <canvas class="au-stats-graph"></canvas>
        <div class="au-stats-text">
          <div class="au-stats-dirty-checker">
            <div class="au-stats-title">DC:</div>
            <div class="au-stats-value"></div>
          </div>
          <div class="au-stats-micro-tasks">
            <div class="au-stats-title">MT:</div>
            <div class="au-stats-value"></div>
          </div>
          <div class="au-stats-regular-tasks">
            <div class="au-stats-title">RT:</div>
            <div class="au-stats-value"></div>
          </div>
          <div class="au-stats-summary">
            <div class="au-stats-title">SUM:</div>
            <div class="au-stats-value"></div>
          </div>
        </div>
      </div>
    `);
  }

  initElement() {
    $(document.body).append(this.rootEl);

    this.graphEl = this.rootEl.find('.au-stats-graph');
    this.graphCtx = this.graphEl[0].getContext('2d');

    this.statsEl = this.rootEl.find('.au-stats-text');

    this.dcValueEl = this.statsEl.find('.au-stats-dirty-checker .au-stats-value');
    this.mtValueEl = this.statsEl.find('.au-stats-micro-tasks .au-stats-value');
    this.rtValueEl = this.statsEl.find('.au-stats-regular-tasks .au-stats-value');
    this.sumValueEl = this.statsEl.find('.au-stats-summary .au-stats-value');
  }

  resize() {
    // set context size doesn't work via css, but works via attribute height/width
    this.graphEl.attr({
      width: this.graphEl.width(),
      height: this.graphEl.height()
    });

    this.width = this.rootEl.width();
    this.height = this.rootEl.height();
    this.textHeight = this.statsEl.height();
    this.canvasHeight = this.height - this.textHeight;
    this.lineWidth = Math.ceil(this.width / 100);
    
    this.clearCurrentStats();
  }
  
  now() {
    if (window.performance) {
      return window.performance.now();
    } else {
      return Date.now();
    }
  }

  patchDirtyChecker() {
    var self = this;

    var oldCheck = this.observerLocator.dirtyChecker.check;

    this.observerLocator.dirtyChecker.check = function() {
      self.currentStats.dirtyCheckerSize = Math.max(self.currentStats.dirtyCheckerSize, this.tracked.length);
      var startTime = self.now();
      oldCheck.call(this);
      self.currentStats.dirtyCheckerLength += self.now() - startTime;
    }

    if (this.debugDirtyChecker) {
      var oldAddProperty = this.observerLocator.dirtyChecker.addProperty;

      this.observerLocator.dirtyChecker.addProperty = function(property) {
        console.log(`Dirty check property "${property.propertyName}" for object`, property.obj);
        return oldAddProperty.call(this, property);
      };
    }
  }

  patchTaskQueue() {
    var self = this;

    var oldFlushMicroTaskQueue = this.observerLocator.taskQueue.flushMicroTaskQueue;

    this.observerLocator.taskQueue.flushMicroTaskQueue = function() {
      self.currentStats.microTaskQueueSize = Math.max(self.currentStats.microTaskQueueSize, this.microTaskQueue.length);
      var startTime = self.now();
      oldFlushMicroTaskQueue.call(this);
      self.currentStats.microTaskQueueLength += self.now() - startTime;
    };

    var oldFlushTaskQueue = this.observerLocator.taskQueue.flushTaskQueue;

    this.observerLocator.taskQueue.flushTaskQueue = function() {
      self.currentStats.taskQueueSize = Math.max(self.currentStats.taskQueueSize, this.taskQueue.length);
      var startTime = self.now();
      oldFlushTaskQueue.call(this);
      self.currentStats.taskQueueLength += self.now() - startTime;
    };
  }

  scheduleTask() {
    setTimeout(this.task.bind(this), this.interval);
  }

  clearCurrentStats() {
    this.currentStats = {
      dirtyCheckerSize: 0,
      dirtyCheckerLength: 0,
      microTaskQueueSize: 0,
      microTaskQueueLength: 0,
      taskQueueSize: 0,
      taskQueueLength: 0
    };
  }

  getCurrentStats() {
    return {
      dirtyCheckerSize: this.currentStats.dirtyCheckerSize,
      dirtyCheckerLength: Math.round(this.currentStats.dirtyCheckerLength * 100) / 100,
      microTaskQueueSize: this.currentStats.microTaskQueueSize,
      microTaskQueueLength: Math.round(this.currentStats.microTaskQueueLength * 100) / 100,
      taskQueueSize: this.currentStats.taskQueueSize,
      taskQueueLength: Math.round(this.currentStats.taskQueueLength * 100) / 100
    };
  }

  task() {
    var stats = this.getCurrentStats();

    var totalLength = stats.dirtyCheckerLength
                    + stats.microTaskQueueLength
                    + stats.taskQueueLength;
    var totalLoad = Math.round(totalLength / this.interval * 100);

    this.clearCurrentStats();

    var ratio = totalLength / (this.threshold * (this.interval / 1000));
    if (ratio > 1) {
      ratio = 1;
    }

    var color = ratio == 1 ? 'red' : (ratio > this.warnLevel ? 'orange' : 'green');

    var imageData = this.graphCtx.getImageData(this.lineWidth, 0, this.width - this.lineWidth, this.canvasHeight);
    this.graphCtx.putImageData(imageData, 0, 0);

    this.graphCtx.fillStyle = 'black';
    this.graphCtx.fillRect(this.width - this.lineWidth, 0, this.lineWidth, this.canvasHeight);

    var size = Math.round(this.canvasHeight * ratio);

    this.graphCtx.fillStyle = color;
    this.graphCtx.fillRect(this.width - this.lineWidth, this.canvasHeight - size - 1, this.lineWidth, size);

    this.dcValueEl.html(`${stats.dirtyCheckerSize} / ${stats.dirtyCheckerLength} ms`);
    this.mtValueEl.html(`${stats.microTaskQueueSize} / ${stats.microTaskQueueLength} ms`);
    this.rtValueEl.html(`${stats.taskQueueSize} / ${stats.taskQueueLength} ms`);
    this.sumValueEl.html(`${totalLoad}% / ${totalLength} ms`);

    this.scheduleTask();
  }
};

export function configure(frameworkConfiguration, pluginConfiguration) {
  AureliaStatsPlugin.configure(frameworkConfiguration, pluginConfiguration);
}
