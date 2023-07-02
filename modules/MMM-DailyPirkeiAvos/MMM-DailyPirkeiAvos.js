Module.register("MMM-PirkeiAvot", {
  defaults: {
    updateInterval: 24 * 60 * 60 * 1000, // Update every 24 hours
  },

  start: function () {
    this.loaded = false;

    this.getMishna();
    var self = this;
    setInterval(function () {
      self.getMishna();
    }, this.config.updateInterval);
  },

  getDom: function () {
    var wrapper = document.createElement("div");

    if (!this.loaded) {
      wrapper.innerHTML = "Loading...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    wrapper.innerHTML = `Pirkei Avot ${this.mishna.chapter}:${this.mishna.mishna} - ${this.mishna.text}`;

    return wrapper;
  },

  getMishna: function () {
    this.sendSocketNotification("GET_MISHNA", {});
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "MISHNA_RESULT") {
      this.mishna = payload;
      this.loaded = true;
      this.updateDom();
    }
  },
});
