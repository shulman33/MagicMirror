/* global Module */

/* Magic Mirror
 * Module: MMM-Chess-Daily
 *
 * By Nout Kleef
 * MIT Licensed.
 */

Module.register("MMM-Chess-Daily", {
	defaults: {
		updateInterval: 60000,
		username: "",
		maxGames: 5,
		maxBoards: 1,
		highlightLastMove: true,
		theme: "classic"
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function () {
		var self = this;
		var gamesArray = null;
		if (this.config.maxGames < 0) {
			this.config.maxGames = Number.MAX_SAFE_INTEGER;
		}

		//Flag for check if module is loaded
		this.loaded = false;

		// Schedule update timer.
		this.getData();
		setInterval(function () {
			self.getData();
		}, this.config.updateInterval);
	},

	/*
	 * getData
	 * function example return data and show it in the module wrapper
	 * get a URL request
	 *
	 */
	getData: function () {
		// this.sendSocketNotification("MMM-Chess-Daily-GET-DATA", this.config.username);
		this.sendSocketNotification("MMM-Chess-Daily-GET-GAMES", this.config.username);
	},


	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function (delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad;
		var self = this;
		setTimeout(function () {
			self.getData();
		}, nextLoad);
	},

	getUsername: function (url) {
		return url.substr(url.lastIndexOf("/") + 1);
	},

	getLastMove: function (pgn) {
		// TODO: implement edge case where no moves have been made
		var lastDot = pgn.lastIndexOf("."); // either "31. a6" or "31... a6"
		var start = Math.max(pgn.lastIndexOf(" ", lastDot), pgn.lastIndexOf("]", lastDot)) + 1;
		var end = pgn.indexOf(" ", lastDot + 2);
		return end === -1 ? "N/A" : pgn.substring(start, end);
	},

	swapOrientation: function (square) {
		return [7 - square[0], 7 - square[1]];
	},

	// returns [file, rank] of the destination square
	// NB: assumes white orientation
	getDestinationSquare: function (move) {
		var castlesIdx, promotionIdx, takesIdx;
		var isWhite = !move.includes("...");
		var end = move.length - 1;

		castlesIdx = move.indexOf("O-O");
		if (castlesIdx !== -1) { // castling
			if (move.includes("O-O-O")) { // queenside
				return isWhite ? [2, 0] : [2, 7];
			} else { // kingside
				return isWhite ? [6, 0] : [6, 7];
			}
		}
		promotionIdx = move.indexOf("=");
		if (promotionIdx !== -1) { // pawn promotion
			return [
				move.charCodeAt(promotionIdx - 2) - 97,
				move.charCodeAt(promotionIdx - 1) - 49
			];
		}
		takesIdx = move.indexOf("x");
		if (takesIdx !== -1) { // taking on destination square
			return [
				move.charCodeAt(takesIdx + 1) - 97,
				move.charCodeAt(takesIdx + 2) - 49
			];
		}
		if (move[end] === "+" || (move[end] === "#")) {
			end--;
		}
		return [
			move.charCodeAt(end - 1) - 97,
			move.charCodeAt(end) - 49
		];
	},

	getDeadline: function (game) {
		return moment(game.move_by * 1000).fromNow();
	},

	isUserTurn: function (game) {
		return (game.turn === "white" && this.getUsername(game.white) === this.config.username) ||
			(game.turn === "black" && this.getUsername(game.black) === this.config.username);
	},

	createCell: function (className, innerHTML) {
		var cell = document.createElement("td");
		cell.className = "divTableCell " + className;
		cell.innerHTML = innerHTML;
		return cell;
	},

	addTurnIndicator: function (userTurn) {
		var icon = userTurn ? "arrow-circle-right" : "hourglass-half";
		return this.createCell("", "<i class='fa fa-" + icon + "' aria-hidden='true'></i>");
	},

	addOpponentInfo: function (game, opponentIsWhite) {
		var username = this.getUsername(opponentIsWhite ? game.white : game.black);
		return this.createCell("", username);
	},

	addLastMove: function (game) {
		var lastMove = this.getLastMove(game.pgn);
		return this.createCell("", lastMove);
	},

	addDeadline: function (game) {
		return this.createCell("", moment(game.move_by * 1000).fromNow());
	},

	piecesBaseUrl: "<img src='http://images.chesscomfiles.com/chess-themes/pieces/",

	getPieceSrc: function (fenLetter) {
		switch (fenLetter) {
			case "p": return this.piecesBaseUrl + this.config.theme + "/75/bp.png' />";
			case "r": return this.piecesBaseUrl + this.config.theme + "/75/br.png' />";
			case "n": return this.piecesBaseUrl + this.config.theme + "/75/bn.png' />";
			case "b": return this.piecesBaseUrl + this.config.theme + "/75/bb.png' />";
			case "q": return this.piecesBaseUrl + this.config.theme + "/75/bq.png' />";
			case "k": return this.piecesBaseUrl + this.config.theme + "/75/bk.png' />";
			case "P": return this.piecesBaseUrl + this.config.theme + "/75/wp.png' />";
			case "R": return this.piecesBaseUrl + this.config.theme + "/75/wr.png' />";
			case "N": return this.piecesBaseUrl + this.config.theme + "/75/wn.png' />";
			case "B": return this.piecesBaseUrl + this.config.theme + "/75/wb.png' />";
			case "Q": return this.piecesBaseUrl + this.config.theme + "/75/wq.png' />";
			case "K": return this.piecesBaseUrl + this.config.theme + "/75/wk.png' />";
		}
		return undefined;
	},

	getBoardDom: function (fen, userIsBlack, lastMove) {
		var board = document.createElement("table");
		board.className = "chessBoard";
		for (var i = 0; i < 8; i++) {
			var rank = document.createElement("tr");
			for (var j = 0; j < 8; j++) {
				var cell = document.createElement("td");
				rank.appendChild(cell);
			}
			board.appendChild(rank);
		}

		// parse FEN
		var square = 1;
		var i = 0;
		while ((square <= 64) && (i <= fen.length)) {
			var letter = fen[i++];
			var aFile = ((square - 1) % 8);
			var aRank = ((square - 1) >> 3); // integer division by 8
			if (userIsBlack) {
				aFile = 7 - aFile;
				aRank = 7 - aRank;
			}
			// var sq = (ESquare)(((aRank - 1) * 8) + (aFile - 1));
			var src = this.getPieceSrc(letter);
			if (src !== undefined) {
				board.rows[aRank].cells[aFile].innerHTML = src;
			} else {
				switch (letter) {
					case '/': square--; break;
					case '1': break;
					case '2': square++; break;
					case '3': square += 2; break;
					case '4': square += 3; break;
					case '5': square += 4; break;
					case '6': square += 5; break;
					case '7': square += 6; break;
					case '8': square += 7; break;
					default: return -1;
				}
			}
			square++;
		}

		// highlight destination square
		if (this.config.highlightLastMove && lastMove.includes(".")) {
			var dest = this.getDestinationSquare(lastMove);
			if (userIsBlack) {
				dest = this.swapOrientation(dest);
			}
			console.log(dest, lastMove);
			console.info("highlighting", dest);
			board.rows[7 - dest[1]].cells[dest[0]].innerHTML += "<div class='destination'></div>";
			console.log(board.rows[7 - dest[1]].cells[dest[0]]);
		}

		return board;
	},

	getDom: function () {
		var wrapper = document.createElement("div");

		if (!this.loaded) {
			wrapper.innerHTML = "Loading...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		console.log("building DOM...");
		var divTable = document.createElement("div");
		divTable.className = "divTable normal small light";
		var divBody = document.createElement("table");
		divBody.className = "divTableBody";

		if (!this.gamesArray) {
			return wrapper;
		}

		var boardsShown = 0;

		// TODO: add opponent avatars
		this.gamesArray.forEach(game => {
			var opponent = this.getUsername(game.white);
			var userTurn = this.isUserTurn(game);
			var divRow = document.createElement("tr");
			var boardRow = document.createElement("tr");
			var opponentIsWhite = true;
			divRow.className = "divTableRow";
			boardRow.className = "divTableRow";

			if (opponent === this.config.username) {
				opponent = this.getUsername(game.black);
				opponentIsWhite = false;
				divRow.className += " white";
			} else {
				divRow.className += " black";
			}
			if (userTurn) {
				divRow.className += " userTurn bright";
			}

			divRow.appendChild(this.addTurnIndicator(userTurn));
			divRow.appendChild(this.addOpponentInfo(game, opponentIsWhite));
			divRow.appendChild(this.addLastMove(game));
			divRow.appendChild(this.addDeadline(game));

			if (boardsShown < this.config.maxBoards) {
				var wrapperCell = this.createCell("", "");
				wrapperCell.colSpan = 4;
				wrapperCell.appendChild(
					this.getBoardDom(game.fen, opponentIsWhite, this.getLastMove(game.pgn))
				);
				boardRow.appendChild(wrapperCell);
				boardsShown++;
			}

			divBody.appendChild(divRow);
			divBody.appendChild(boardRow);
		});

		divTable.appendChild(divBody);
		wrapper.appendChild(divTable);
		return wrapper;
	},

	getScripts: function () {
		return [];
	},

	getStyles: function () {
		return [
			"MMM-Chess-Daily.css", "font-awesome.css"
		];
	},

	// Load translations files
	getTranslations: function () {
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	processData: function (data) {
		var self = this;
		// sort by userTurn, deadline
		data.games.sort(function (a, b) {
			const aTurn = this.isUserTurn(a);
			if (aTurn === this.isUserTurn(b)) {
				return a.deadline - b.deadline;
			} else {
				return aTurn ? -1 : 1;
			}
		}.bind(this));
		// respect maximum entries
		this.gamesArray = data.games.slice(0, this.config.maxGames);
		this.loaded = true;
		self.updateDom(self.config.animationSpeed);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if (notification === "MMM-Chess-Daily-GAMES-RECEIVED") {
			console.log("games received - processing " + payload.body.games.length +
				" games in total");
			this.processData(payload.body);
		}
	},
});
