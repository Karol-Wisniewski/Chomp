import {Board} from "./Board.jsx";
import {useEffect} from "react";

export function Game({gameData, requestSettingBoardDimensions, requestBoardCellEat}) {
	const {game, yourPlayerIndex} = gameData;

	useEffect(() => {
		if (yourPlayerIndex !== 1) {
			return;
		}

		if (game.state === "AWAITING_BOARD_DIMENSIONS") {
			const boardWidth = (() => {
				for (;;) {
					const boardWidth = parseInt(prompt("Board width? (Max: 20)", 5));

					if (isNaN(boardWidth) || boardWidth < 1 || boardWidth > 20) {
						continue;
					}

					return boardWidth;
				}
			})();

			const boardHeight = (() => {
				for (;;) {
					const boardHeight = parseInt(prompt("Board height? (Max: 20)", 4));

					if (isNaN(boardHeight) || boardHeight < 1 || boardHeight > 20) {
						continue;
					}

					return boardHeight;
				}
			})();

			requestSettingBoardDimensions({width: boardWidth, height: boardHeight});
		}
	}, [game, yourPlayerIndex]);

	const handleBoardCellClick = (cellPosition) => {
		requestBoardCellEat(cellPosition);
	};

	useEffect(() => {
		if (game.state === "FINISHED") {
			alert(
				`Game finished. Winner: Player ${game.winnerPlayerIndex}${
					game.winnerPlayerIndex === yourPlayerIndex ? " (you)" : ""
				}`,
			);
		}
	}, [game]);

	return (
		<div>
			<p>You are player {yourPlayerIndex}</p>
			{/* {JSON.stringify(game)} */}
			{(game.state === "WAITING" || game.state === "AWAITING_BOARD_DIMENSIONS")&& <p>Waiting for players...</p>}
			{game.state === "PLAYING" && game.activePlayerIndex === yourPlayerIndex ? (
				<p>Your turn!</p>
			) : (
				game.state === "PLAYING" && <p>Waiting for another player...</p>
			)}
			{game.state === "PLAYING" || game.state === "FINISHED" ? (
				<Board
					isActive={game.state === "PLAYING" && game.activePlayerIndex === yourPlayerIndex}
					onCellClick={handleBoardCellClick}
					board={game.board}
				/>
			) : null}
		</div>
	);
}
