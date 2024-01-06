import {WebSocketServer} from "ws";

const webSocketServer = new WebSocketServer({port: 8080});

let game = {
	state: "WAITING",
	playerWebSocketClients: [],
};

function jsonifyGame(game) {
	const {playerWebSocketClients, ...gameWithoutPlayerWebSocketClients} = game;

	return {
		...gameWithoutPlayerWebSocketClients,
		playersCount: playerWebSocketClients.length,
	};
}

console.log("Game created:", jsonifyGame(game));

function updateGame(newGame) {
	game = newGame;

	console.log("Game updated:", jsonifyGame(game));

	game.playerWebSocketClients.forEach((webSocketClient, currentPlayerIndex) => {
		webSocketClient.send(
			JSON.stringify({game: jsonifyGame(game), yourPlayerIndex: currentPlayerIndex + 1}),
		);
	});
}

function transitionToInitial() {
	game.playerWebSocketClients.forEach((webSocketClient) => {
		webSocketClient.close();
	});

	const newGame = {
		state: "WAITING",
		playerWebSocketClients: [],
	};

	updateGame(newGame);
}

// Player without opponent left or player with opponent left
function handleWebSocketClientClose(webSocketClient) {
	const newPlayerWebSocketClients = game.playerWebSocketClients.filter(
		(playerWebSocketClient) => playerWebSocketClient !== webSocketClient,
	);

	if (newPlayerWebSocketClients.length === game.playerWebSocketClients.length) {
		return;
	}

	const webSocketClientWhichLeftIndex = game.playerWebSocketClients.indexOf(webSocketClient);
	const playerWhoLeftIndex = webSocketClientWhichLeftIndex + 1;

	if (game.state === "PLAYING") {
		const playerWhoWonIndex = playerWhoLeftIndex === 1 ? 2 : 1;
		transitionToGameFinished(game.board, playerWhoWonIndex);

		return;
	}

	const newGame = {
		...game,
		playerWebSocketClients: newPlayerWebSocketClients,
	};

	updateGame(newGame);

	transitionToInitial();
}

function transitionToAwaitingBoardDimensions() {
	const newGameAwaitingBoardDimensions = {
		...game,
		state: "AWAITING_BOARD_DIMENSIONS",
	};

	updateGame(newGameAwaitingBoardDimensions);
}

function transitionToWithNewWebSocketsClient(webSocketClient) {
	const newPlayerWebSocketClients = [...game.playerWebSocketClients, webSocketClient];

	const newGame = {
		...game,
		playerWebSocketClients: newPlayerWebSocketClients,
	};

	updateGame(newGame);

	if (newPlayerWebSocketClients.length == 2) {
		transitionToAwaitingBoardDimensions();
	}
}

function createBoard(dimensions) {
	return Array(dimensions.height)
		.fill(null)
		.map(() => Array(dimensions.width).fill(false));
}

const handleSetBoardDimensionsRequest = (webSocketClient, dimensions) => {
	if (game.state !== "AWAITING_BOARD_DIMENSIONS") {
		return;
	}

	const webSocketClientIndex = game.playerWebSocketClients.indexOf(webSocketClient);

	if (webSocketClientIndex !== 0) {
		return;
	}

	if (
		dimensions.width < 1 ||
		dimensions.width > 20 ||
		dimensions.height < 1 ||
		dimensions.height > 20
	) {
		return;
	}

	const board = createBoard(dimensions);

	const newGame = {
		...game,
		state: "PLAYING",
		board,
		activePlayerIndex: 1,
	};

	updateGame(newGame);
};

function computeCellEatInBoard(board, cellPosition) {
	return board.map((row, cellY) =>
		row.map(
			(isCellEaten, cellX) => isCellEaten || (cellY >= cellPosition.y && cellX >= cellPosition.x),
		),
	);
}

function transitionToGameFinished(newBoard, winnerPlayerIndex) {
	const newGame = {
		...game,
		state: "FINISHED",
		board: newBoard,
		winnerPlayerIndex,
	};

	updateGame(newGame);

	setTimeout(() => {
		transitionToInitial();
	}, 2000);
}

function handleBoardCellEatRequest(webSocketClient, cellPosition) {
	const webSocketClientIndex = game.playerWebSocketClients.indexOf(webSocketClient);

	if (webSocketClientIndex !== game.activePlayerIndex - 1) {
		return;
	}

	const newBoard = computeCellEatInBoard(game.board, cellPosition);

	const isGameFinished = newBoard[0][0];

	if (isGameFinished) {
		const winnerPlayerIndex = game.activePlayerIndex === 1 ? 2 : 1;

		transitionToGameFinished(newBoard, winnerPlayerIndex);

		return;
	}

	const newGame = {
		...game,
		board: newBoard,
		activePlayerIndex: (game.activePlayerIndex % 2) + 1,
	};

	updateGame(newGame);
}

const handlerByMessageType = {
	SET_BOARD_DIMENSIONS: handleSetBoardDimensionsRequest,
	BOARD_CELL_EAT: handleBoardCellEatRequest,
};

function handleWebSocketClientMessage(webSocketClient, message) {
	const handler = handlerByMessageType[message.type];

	if (handler === undefined) {
		console.log("Unknown message type:", message.type);
		return;
	}

	handler(webSocketClient, message.payload);
}

function handleWebSocketClientRawMessage(webSocketClient, rawMessage) {
	const message = JSON.parse(rawMessage);

	handleWebSocketClientMessage(webSocketClient, message);
}

function acceptWebSocketClient(webSocketClient) {
	transitionToWithNewWebSocketsClient(webSocketClient);

	webSocketClient.on("close", () => {
		handleWebSocketClientClose(webSocketClient);
	});

	webSocketClient.on("message", (rawMessage) => {
		handleWebSocketClientRawMessage(webSocketClient, rawMessage);
	});
}

webSocketServer.on("connection", (webSocketClient) => {
	if (game.state === "WAITING" && game.playerWebSocketClients.length < 2) {
		acceptWebSocketClient(webSocketClient);
	} else {
		webSocketClient.close();
	}
});
