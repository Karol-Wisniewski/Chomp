import {Game} from "./Game.jsx";
import {useState} from "react";

export function App() {
	const [gameState /* {webSocket, gameData: {game, yourIndex}} */, setGameState] = useState(null);
	const [isReadyButtonDisabled, setIsReadyButtonDisabled] = useState(false);

	const handleReadyButtonClick = () => {
		setIsReadyButtonDisabled(true);

		const webSocket = new WebSocket("ws://localhost:8080");

		const requestSettingBoardDimensions = (dimensions) => {
			webSocket.send(JSON.stringify({type: "SET_BOARD_DIMENSIONS", payload: dimensions}));
		};

		const requestBoardCellEat = (cellPosition) => {
			webSocket.send(JSON.stringify({type: "BOARD_CELL_EAT", payload: cellPosition}));
		};

		webSocket.addEventListener("open", () => {
			setGameState({webSocket, gameData: null, requestSettingBoardDimensions, requestBoardCellEat});
		});

		webSocket.addEventListener("message", (event) => {
			const newGameData = JSON.parse(event.data);

			console.log("New game data:", newGameData);

			setGameState((oldGameState) => ({...oldGameState, gameData: newGameData}));
		});

		webSocket.addEventListener("close", () => {
			setGameState(null);
			alert("You have been disconnected from the server.");
			setIsReadyButtonDisabled(false);
		});

		// when is it called?
		webSocket.addEventListener("error", () => {
			// necessary if the connection is still present
			webSocket.close();
			setGameState(null);
			setIsReadyButtonDisabled(false);
		});
	};

	return (
		<main>
			<h1>CHOMP</h1>
			{gameState === null ? (
				<button type="button" onClick={handleReadyButtonClick} disabled={isReadyButtonDisabled}>
					I'm ready!
				</button>
			) : gameState.gameData === null ? (
				<p>Connecting to the game...</p>
			) : (
				<Game
					gameData={gameState.gameData}
					requestSettingBoardDimensions={gameState.requestSettingBoardDimensions}
					requestBoardCellEat={gameState.requestBoardCellEat}
				/>
			)}
		</main>
	);
}
