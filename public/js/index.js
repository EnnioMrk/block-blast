// Game configuration
const GAME_CONFIG = {
  grid: {
    size: 50,
    rows: 10,
    cols: 10,
  },
  preview: {
    size: 25,
    rows: 5,
    cols: 5,
    spacing: 20,
  },
};

// Initialize preview configuration
const previewGridSize = GAME_CONFIG.preview.size;
const previewRows = GAME_CONFIG.preview.rows;
const previewCols = GAME_CONFIG.preview.cols;
const previewSpacing = GAME_CONFIG.preview.spacing;
const gridSize = GAME_CONFIG.grid.size;
const rows = GAME_CONFIG.grid.rows;

// Initialize game components
async function initializeGame() {
  // Load UI configuration
  const uiResponse = await fetch("/assets/ui.json");
  const config = await uiResponse.json();

  // Setup game canvas
  const gameCanvas = document.getElementById("game");
  const game = new cvh_game(
    gameCanvas,
    [() => window.innerWidth, () => window.innerHeight],
    { backgroundColor: "#000" }
  );

  // Create object manager
  const om = new cvh_object_manager(game);

  // Create main game grid
  const grid = createMainGrid(om);

  return { game, om, grid, config };
}

// Create the main game grid
function createMainGrid(om) {
  const { size, rows, cols } = GAME_CONFIG.grid;
  return new cvh_grid(
    om,
    (window.innerWidth - cols * size) / 2,
    (window.innerHeight - rows * size) / 2 - 50,
    rows,
    cols,
    size
  );
}

const pieceBag = new PieceBag(window.tetrisPieces);

// Track the currently dragged piece
let draggedPiece = null;
let draggedBlocks = [];
let originalPositions = [];

// Function to create a preview piece
function createPreviewPiece(index, om) {
  const piece = pieceBag.next();
  const shape = piece.shape;

  // Calculate the base position for this preview area
  const previewAreaWidth = previewGridSize * previewCols;
  const baseX =
    (window.innerWidth - totalPreviewWidth) / 2 +
    index * (previewAreaWidth + previewSpacing);
  const baseY = (window.innerHeight + rows * gridSize) / 2 - 50;

  // Find the actual bounding box of the piece
  let minRow = Infinity,
    maxRow = -Infinity;
  let minCol = Infinity,
    maxCol = -Infinity;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }
  }

  // Calculate the center of the preview area
  const previewCenterX = baseX + previewAreaWidth / 2;
  const previewCenterY = baseY + (previewGridSize * previewRows) / 2;

  // Calculate the actual piece center relative to its bounding box
  const pieceCenterX = ((minCol + maxCol + 1) * previewGridSize) / 2;
  const pieceCenterY = ((minRow + maxRow + 1) * previewGridSize) / 2;

  // Determine the starting position to center the piece
  const startX = previewCenterX - pieceCenterX;
  const startY = previewCenterY - pieceCenterY;

  const blocks = [];
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const block = om.create.rectangle(
          startX + col * previewGridSize,
          startY + row * previewGridSize,
          previewGridSize,
          previewGridSize,
          {
            fill: piece.color,
            border: { color: "#fff", width: 1 },
            isPreview: true,
            pieceShape: shape,
            pieceColor: piece.color,
          }
        );
        blocks.push(block);
      }
    }
  }
  return blocks;
}

// Calculate total width of preview areas including spacing
const totalPreviewWidth =
  previewCols * previewGridSize * 3 + previewSpacing * 2;

// Create preview areas array
const previewAreas = [];

// Initialize preview pieces after game setup
async function initializePreviewPieces(om) {
  for (let i = 0; i < 3; i++) {
    previewAreas.push(createPreviewPiece(i, om));
  }
}

// Add click and drag handling
// Handle piece placement and grid interaction
class GridClickHandler extends clickListener {
  constructor(om) {
    super(om);
    this.initializeState();
    this.setupEventListeners(om);
  }

  initializeState() {
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.cursorPreviewBlocks = [];
  }

  setupEventListeners(om) {
    const canvas = om.game.canvas;
    const events = [
      ["mousedown", this.handleMouseDown],
      ["mousemove", this.handleMouseMove],
      ["mouseup", this.handleMouseUp],
    ];

    events.forEach(([event, handler]) => {
      window.addEventListener(event, handler.bind(this));
    });
  }

  handleMouseDown(event) {
    if (event.button !== 0) return; // Only handle left mouse button

    const rect = this.om.game.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const previewBlock = this.findClickedPreviewBlock(event);
    if (previewBlock) {
      this.startDragging(previewBlock, mouseX, mouseY);
      this.createCursorPreview(mouseX, mouseY);
    }
  }

  findClickedPreviewBlock(event) {
    const clickedElements = [];
    this.om.objects.forEach((o) => {
      if (o.isInBounds(event.clientX, event.clientY)) {
        clickedElements.push(o);
      }
    });
    return clickedElements.find((element) => element.isPreview);
  }

  startDragging(previewBlock, mouseX, mouseY) {
    this.isDragging = true;
    draggedPiece = previewBlock;

    const previewArea = previewAreas.find((area) =>
      area.includes(previewBlock)
    );
    draggedBlocks = previewArea;

    this.storeOriginalPositions();
    this.makeBlocksTransparent();

    this.dragStartX = mouseX;
    this.dragStartY = mouseY;
  }

  storeOriginalPositions() {
    originalPositions = draggedBlocks.map((block) => ({
      x: block.x,
      y: block.y,
      w: block.w,
      h: block.h,
      fill: block.fill,
    }));
  }

  makeBlocksTransparent() {
    draggedBlocks.forEach((block) => {
      if (!block.fill.includes("rgba")) {
        const [r, g, b] = this.hexToRgb(block.fill);
        block.fill = `rgba(${r}, ${g}, ${b}, 0.5)`;
      }
    });
  }

  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  createCursorPreview(mouseX, mouseY) {
    this.cursorPreviewBlocks = [];
    const shape = draggedPiece.pieceShape;

    const pieceWidth = shape[0].length * GAME_CONFIG.grid.size;
    const pieceHeight = shape.length * GAME_CONFIG.grid.size;

    this.dragOffsetX = pieceWidth / 2;
    this.dragOffsetY = pieceHeight / 2;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const block = this.om.create.rectangle(
            mouseX - this.dragOffsetX + c * GAME_CONFIG.grid.size,
            mouseY - this.dragOffsetY + r * GAME_CONFIG.grid.size,
            GAME_CONFIG.grid.size,
            GAME_CONFIG.grid.size,
            {
              fill: draggedPiece.pieceColor,
              border: { color: "#fff", width: 1 },
              isCursorPreview: true,
            }
          );
          this.cursorPreviewBlocks.push(block);
        }
      }
    }
  }

  handleMouseMove(event) {
    if (!this.isDragging || !draggedBlocks.length) return;

    const rect = this.om.game.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Calculate movement distance
    const dx = mouseX - this.dragStartX;
    const dy = mouseY - this.dragStartY;

    // Only proceed if there's significant movement (more than 5 pixels)
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      // First, make all blocks visible
      draggedBlocks.forEach((block) => {
        block.shouldRender = true;
      });

      // Create or update cursor preview blocks
      if (!this.cursorPreviewBlocks || this.cursorPreviewBlocks.length === 0) {
        // Kill existing previews first (safety check)
        if (this.cursorPreviewBlocks) {
          this.cursorPreviewBlocks.forEach((b) => b.kill());
        }
        this.cursorPreviewBlocks = [];
        const shape = draggedPiece.pieceShape;

        // Find the first block's position in the shape
        let firstBlockRow = 0;
        let firstBlockCol = 0;
        outerLoop: for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
              firstBlockRow = r;
              firstBlockCol = c;
              break outerLoop;
            }
          }
        }

        // Calculate the offset from cursor to first block
        const pieceWidth = shape[0].length * gridSize;
        const pieceHeight = shape.length * gridSize;
        const offsetX = pieceWidth / 2;
        const offsetY = pieceHeight / 2;

        // Store the initial offset
        this.dragOffsetX = offsetX;
        this.dragOffsetY = offsetY;

        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
              const block = om.create.rectangle(
                mouseX - this.dragOffsetX + c * gridSize,
                mouseY - this.dragOffsetY + r * gridSize,
                gridSize,
                gridSize,
                {
                  fill: draggedPiece.pieceColor,
                  border: { color: "#fff", width: 1 },
                  isCursorPreview: true,
                }
              );
              this.cursorPreviewBlocks.push(block);
            }
          }
        }
      } else {
        // Update cursor preview positions based on the stored offset
        const shape = draggedPiece.pieceShape;
        let blockIndex = 0;
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
              const block = this.cursorPreviewBlocks[blockIndex];
              block.x = mouseX - this.dragOffsetX + c * gridSize;
              block.y = mouseY - this.dragOffsetY + r * gridSize;
              blockIndex++;
            }
          }
        }
      }

      // Calculate grid-relative position
      let gridRelativeX = mouseX - grid.x;
      let gridRelativeY = mouseY - grid.y;

      const shape = draggedPiece.pieceShape;
      const shapeWidth = shape[0].length;
      const shapeHeight = shape.length;
      let offsetX = 0;
      let offsetY = 0;

      //divisible by 2
      if (shapeWidth % 2 === 0) {
        gridRelativeX -= gridSize / 2;
        offsetX = 1;
      }
      if (shapeHeight % 2 === 0) {
        gridRelativeY -= gridSize / 2;
        offsetY = 1;
      }

      // Calculate the grid cell the piece is hovering over
      const col =
        Math.floor(gridRelativeX / gridSize) -
        Math.floor(shapeWidth / 2) +
        offsetX;
      const row =
        Math.floor(gridRelativeY / gridSize) -
        Math.floor(shapeHeight / 2) +
        offsetY;

      // Check if the piece can be placed here
      let canPlace = true;
      if (
        row >= 0 &&
        row < GAME_CONFIG.grid.rows &&
        col >= 0 &&
        col < GAME_CONFIG.grid.cols
      ) {
        for (let r = 0; r < shape.length && canPlace; r++) {
          for (let c = 0; c < shape[r].length && canPlace; c++) {
            if (shape[r][c]) {
              const targetRow = row + r;
              const targetCol = col + c;
              const targetCell = grid.getCell(targetRow, targetCol);
              if (!targetCell || targetCell.fill !== "#fff") {
                canPlace = false;
              }
            }
          }
        }

        if (canPlace) {
          // Calculate the position where the piece should be placed
          const targetX = grid.x + col * gridSize;
          const targetY = grid.y + row * gridSize;

          // Move all blocks in the piece while maintaining their relative positions
          let blockIndex = 0;
          for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
              if (shape[r][c]) {
                const block = draggedBlocks[blockIndex];
                block.x = targetX + c * gridSize;
                block.y = targetY + r * gridSize;
                block.w = gridSize;
                block.h = gridSize;
                // Use the original piece color with 50% transparency for valid positions
                const color = block.pieceColor;
                const red = parseInt(color.slice(1, 3), 16);
                const green = parseInt(color.slice(3, 5), 16);
                const blue = parseInt(color.slice(5, 7), 16);
                block.fill = `rgba(${red}, ${green}, ${blue}, 0.5)`;
                blockIndex++;
              }
            }
          }
        } else {
          // Hide the piece if it can't be placed
          draggedBlocks.forEach((block) => {
            block.shouldRender = false;
          });
        }
      } else {
        // Hide the piece if not over the grid
        draggedBlocks.forEach((block) => {
          block.shouldRender = false;
        });
      }
    }
  }

  handleMouseUp(event) {
    if (!this.isDragging || !draggedBlocks.length) return;

    const rect = this.om.game.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Find the grid cell under the mouse
    const cell = grid.getCellAtPosition(mouseX, mouseY);
    if (cell && cell.gridPosition) {
      // Calculate the grid position for placement
      const { row, col } = cell.gridPosition;
      const shape = draggedPiece.pieceShape;
      const color = draggedPiece.pieceColor;

      // Check if the piece can be placed here
      let canPlace = true;
      for (let r = 0; r < shape.length && canPlace; r++) {
        for (let c = 0; c < shape[r].length && canPlace; c++) {
          if (shape[r][c]) {
            const targetRow = row + r;
            const targetCol = col + c - 1;
            const targetCell = grid.getCell(targetRow, targetCol);
            if (!targetCell || targetCell.fill !== "#fff") {
              canPlace = false;
            }
          }
        }
      }

      if (canPlace) {
        // Place the piece on the grid
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
              const targetCell = grid.getCell(row + r, col - 1 + c);
              targetCell.fill = color;
            }
          }
        }

        // Check for completed rows and columns
        const completedRows = [];
        const completedCols = [];

        // Check rows
        for (let r = 0; r < GAME_CONFIG.grid.rows; r++) {
          let isRowComplete = true;
          for (let c = 0; c < GAME_CONFIG.grid.cols; c++) {
            const cell = grid.getCell(r, c);
            if (cell.fill === "#fff") {
              isRowComplete = false;
              break;
            }
          }
          if (isRowComplete) {
            completedRows.push(r);
          }
        }

        // Check columns
        for (let c = 0; c < GAME_CONFIG.grid.cols; c++) {
          let isColComplete = true;
          for (let r = 0; r < GAME_CONFIG.grid.rows; r++) {
            const cell = grid.getCell(r, c);
            if (cell.fill === "#fff") {
              isColComplete = false;
              break;
            }
          }
          if (isColComplete) {
            completedCols.push(c);
          }
        }

        // Clear completed rows
        completedRows.forEach((rowIndex) => {
          // Clear the row
          for (let c = 0; c < GAME_CONFIG.grid.cols; c++) {
            grid.getCell(rowIndex, c).fill = "#fff";
          }
        });

        // Clear completed columns
        completedCols.forEach((colIndex) => {
          // Clear the column
          for (let r = 0; r < GAME_CONFIG.grid.rows; r++) {
            grid.getCell(r, colIndex).fill = "#fff";
          }
        });

        // Remove the preview piece and create a new one
        const previewIndex = previewAreas.findIndex((area) =>
          area.includes(draggedPiece)
        );
        draggedBlocks.forEach((block) => block.kill());
        previewAreas[previewIndex] = createPreviewPiece(previewIndex, this.om);
      } else {
        // Return pieces to original positions and sizes if can't place
        draggedBlocks.forEach((block, index) => {
          block.x = originalPositions[index].x;
          block.y = originalPositions[index].y;
          block.w = previewGridSize;
          block.h = previewGridSize;
          block.fill = originalPositions[index].fill;
          block.shouldRender = true;
        });
      }
    } else {
      // Return pieces to original positions and sizes if not over grid
      draggedBlocks.forEach((block, index) => {
        block.x = originalPositions[index].x;
        block.y = originalPositions[index].y;
        block.w = previewGridSize;
        block.h = previewGridSize;
        block.fill = originalPositions[index].fill;
        block.shouldRender = true;
      });
    }

    // Clean up cursor preview blocks
    if (this.cursorPreviewBlocks) {
      this.cursorPreviewBlocks.forEach((block) => block.kill());
      this.cursorPreviewBlocks = [];
    }

    // Reset dragging state
    this.isDragging = false;
    draggedPiece = null;
    draggedBlocks = [];
    originalPositions = [];
  }
}

// Initialize game and UI
const { game, om, grid, config } = await initializeGame();

// Get reference to game canvas
const gameCanvas = document.getElementById("game");

// Create preview pieces
await initializePreviewPieces(om);

// Initialize click handler
const clickHandler = new GridClickHandler(om);

// Initialize UI manager
const wrapper = document.getElementById("mainWrapper");
const uim = new uih_manager(game, wrapper);

// Register game page
const gamePageConfig = {
  id: "Game",
  wrapper: gameCanvas.parentElement,
  onload: () => {
    gameCanvas.style.display = "block";
    game.start();
  },
  offload: () => {
    gameCanvas.style.display = "none";
    game.stop();
  },
};

// Load UI templates and start the game
await uim.get_all_templates();
uim.register_page(gamePageConfig);
uim.load_ui(config);
