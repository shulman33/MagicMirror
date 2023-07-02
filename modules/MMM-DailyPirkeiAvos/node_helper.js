import { create } from "node_helper";
import { fetch } from "node-fetch";

export default create({
  start: function () {
    console.log("MMM-PirkeiAvot helper started...");
  },

  getMishna: function () {
    var self = this;
    var chaptersCount = 5;
    var randomChapter = Math.floor(Math.random() * chaptersCount) + 1;

    fetch(`https://www.sefaria.org/api/texts/Pirkei_Avot.${randomChapter}`)
      .then((response) => response.json())
      .then((data) => {
        var mishnasCount = data.he.length;
        var randomMishna = Math.floor(Math.random() * mishnasCount);
        var mishnaText = data.he[randomMishna];

        self.sendSocketNotification("MISHNA_RESULT", {
          chapter: randomChapter,
          mishna: randomMishna + 1,
          text: mishnaText,
        });
      })
      .catch((error) => console.error("Error:", error));
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_MISHNA") {
      this.getMishna(payload);
    }
  },
});
