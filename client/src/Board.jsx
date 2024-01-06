import "./style/Board.scss";

function BoardCellContent({position, isEaten, onCellClick, isActive}) {
	const handleButtonClick = () => {
		onCellClick(position);
	};

	return (
		<button
			type="button"
			onClick={handleButtonClick}
			disabled={isEaten || !isActive}
			className={["board-cell", ...(isEaten ? ["board-cell--eaten"] : [])].join(" ")}
		>
			🍫
		</button>
	);
}

export function Board({board, onCellClick, isActive}) {
	return (
		<table>
			<tbody>
				{board.map((row, y) => (
					<tr key={y}>
						{row.map((isEaten, x) => (
							<td key={x}>
								<BoardCellContent
									position={{x, y}}
									isEaten={isEaten}
									onCellClick={onCellClick}
									isActive={isActive}
								/>
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}
