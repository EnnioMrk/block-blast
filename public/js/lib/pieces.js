window.tetrisPieces = [
  // Classic Tetris Pieces
  { shape: [[1, 1, 1, 1]], color: "#00f0f0" }, // I piece
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#f0f000",
  }, // O piece
  {
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: "#a000f0",
  }, // T piece
  {
    shape: [
      [1, 1, 1],
      [1, 0, 0],
    ],
    color: "#0000f0",
  }, // L piece
  {
    shape: [
      [1, 1, 1],
      [0, 0, 1],
    ],
    color: "#f0a000",
  }, // J piece
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "#00f000",
  }, // S piece
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "#f00000",
  }, // Z piece

  // Extended Pieces
  {
    shape: [
      [1, 1, 1, 1],
      [0, 0, 1, 0],
    ],
    color: "#ff69b4",
  }, // L with tail
  {
    shape: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    color: "#8a2be2",
  }, // T with tail
  {
    shape: [
      [1, 1],
      [1, 1],
      [1, 1],
    ],
    color: "#ff4500",
  }, // 3x2 rectangle
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    color: "#20b2aa",
  }, // Z with extra block
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: "#ff8c00",
  }, // Cross
  { shape: [[1, 1, 1, 1, 1]], color: "#9370db" }, // Long I (5 blocks)
  {
    shape: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ],
    color: "#ff1493",
  }, // Hollow square
  {
    shape: [
      [1, 1, 1],
      [1, 1, 1],
    ],
    color: "#00ced1",
  }, // 3x2 solid rectangle
  {
    shape: [
      [1, 0, 1],
      [1, 1, 1],
      [1, 0, 1],
    ],
    color: "#ff6347",
  }, // H shape
  {
    shape: [
      [1, 1, 1, 1],
      [1, 0, 0, 0],
    ],
    color: "#7b68ee",
  }, // L with long tail
  {
    shape: [
      [1, 1, 1],
      [0, 1, 1],
      [0, 0, 1],
    ],
    color: "#32cd32",
  }, // Staircase
  {
    shape: [
      [1, 1],
      [1, 0],
      [1, 1],
    ],
    color: "#da70d6",
  }, // U shape
  {
    shape: [
      [1, 1, 1],
      [1, 1, 0],
      [1, 0, 0],
    ],
    color: "#ff7f50",
  }, // Big L
  {
    shape: [
      [1, 1, 1, 1],
      [0, 1, 0, 0],
    ],
    color: "#6a5acd",
  }, // I with a bump
  {
    shape: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
    color: "#ffd700",
  }, // 3x3 square
];
