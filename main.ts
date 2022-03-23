import { MarkdownPostProcessorContext, Plugin } from 'obsidian';

type ShogiPieceType = "pawn" | "bishop" | "rook" | "lance" | "knight" | "silver" | "gold" | "king";

type ShogiPlayer = "sente" | "gote";

interface ShogiPiece {
	type: ShogiPieceType;
	promoted: boolean;
	player: ShogiPlayer;
}

function pieceSymbol(piece: ShogiPiece): string {
	if (piece.promoted) {
		switch (piece.type) {
			case "king":
				return "玉";
			case "rook":
				return "龍";
			case "bishop":
				return "馬";
			case "gold":
				return "金";
			case "silver":
				return "全";
			case "knight":
				return "圭";
			case "lance":
				return "杏";
			case "pawn":
				return "と";
		}
	} else {
		switch (piece.type) {
			case "king":
				return "王";
			case "rook":
				return "飛";
			case "bishop":
				return "角";
			case "gold":
				return "金";
			case "silver":
				return "銀";
			case "knight":
				return "桂";
			case "lance":
				return "香";
			case "pawn":
				return "歩";
		}
	}
}

function parsePieceType(pieceType: string): ShogiPieceType {
	switch (pieceType) {
		case "p":
			return "pawn";
		case "b":
			return "bishop";
		case "r":
			return "rook";
		case "l":
			return "lance";
		case "n":
			return "knight";
		case "s":
			return "silver";
		case "g":
			return "gold";
		case "k":
			return "king";
		default:
			throw Error(`Unknown Piece Type ${pieceType}`);
	}
}

function parsePiece(pieceString: string): ShogiPiece | undefined {
	var player: ShogiPlayer;
	switch (pieceString[0]) {
		case "s":
			player = "sente";
			break;
		case "g":
			player = "gote"
			break;
		case " ":
			return undefined;
		default:
			throw Error(`Unknown Piece Color ${pieceString[0]} Expected s (sente) or g (gote)`);
	}

	var type: ShogiPieceType = parsePieceType(pieceString[1].toLowerCase());


	var promoted = pieceString[1].toUpperCase() === pieceString[1];

	return {
		type,
		promoted,
		player,
	}
}

interface ParsedShogiCode {
	board: (ShogiPiece | undefined)[][];
	senteHand: ShogiPieceType[];
	goteHand: ShogiPieceType[];
}

export default class ObsidianShogi extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor(
			"shogi",
			this.drawShogiBoard()
		);
	}

	private tableCell(piece: boolean = false): HTMLTableCellElement {
		const cell = document.createElement("td");
		cell.style.width = "1.5em";
		cell.style.height = "1.5em";
		cell.style.textAlign = "center";
		cell.style.padding = "0";

		if (piece) {
			cell.style.border = "1px solid var(--text-normal)";
		} else {
			cell.style.border = "none";
		}

		return cell;
	}

	private drawShogiBoard() {
		return (source: string, el: HTMLElement, _: MarkdownPostProcessorContext) => {
			const div = document.createElement("div");
			div.style.display = "flex";
			div.style.flexDirection = "column";
			div.style.alignItems = "center";

			const board = ObsidianShogi.parseCode(source);

			const goteHand = document.createElement("span");
			goteHand.style.fontSize = "var(--font-small)";
			goteHand.textContent = "Gote pieces in hand: " + (board.goteHand.length === 0 ? "-" : board.goteHand.map(type => pieceSymbol({ promoted: false, player: "sente", type })).join(" "));
			div.appendChild(goteHand);

			const table = document.createElement("table");
			table.classList.add("shogi-board");

			const tbody = document.createElement("tbody");

			const headerRow = document.createElement("tr");

			for (let i = 9; i > 0; i--) {
				const columnNumber = this.tableCell();
				columnNumber.textContent = String(i);
				headerRow.appendChild(columnNumber);
			}

			const corner = this.tableCell();
			headerRow.appendChild(corner);

			tbody.appendChild(headerRow);

			board.board.forEach((rowPieces, i) => {
				const row = document.createElement("tr");

				rowPieces.forEach((piece) => {
					const cell = this.tableCell(true);

					if (piece !== undefined) {
						if (piece.promoted && piece.type != "king") {
							cell.style.color = "var(--red)";
						}

						if (piece.player == "gote") {
							cell.style.transform = "rotate(180deg)";
						}

						cell.textContent = pieceSymbol(piece);
					}

					row.appendChild(cell);
				})

				const rowNumber = this.tableCell();
				rowNumber.textContent = String(i + 1);
				row.appendChild(rowNumber);

				tbody.appendChild(row);
			});

			table.appendChild(tbody);
			div.appendChild(table);

			const senteHand = document.createElement("span");
			senteHand.style.fontSize = "var(--font-small)";
			senteHand.textContent = "Sente pieces in hand: " + (board.senteHand.length === 0 ? "-" : board.senteHand.map(type => pieceSymbol({ promoted: false, player: "sente", type })).join(" "));
			div.appendChild(senteHand);

			el.appendChild(div);
		}
	}

	private static parseCode(input: string): ParsedShogiCode {
		const lines = input.split(/\r?\n/);

		const goteHand = lines[0].trim().split("").map(c => parsePieceType(c));
		const senteHand = lines[10].trim().split("").map(c => parsePieceType(c));

		const boardLines = lines.slice(1, 10);
		const board = new Array(9).fill(true).map(() => new Array(9).fill(undefined));

		for (let i = 0; i < 9; i++) {
			const line = boardLines[i];

			line.split("|").map(s => s.trim()).forEach((pieceString, j) => {
				if (pieceString.length >= 2) {

					const piece = parsePiece(pieceString);

					board[i][j] = piece;
				}
			});
		}

		return {
			board,
			senteHand,
			goteHand,
		};
	}
}