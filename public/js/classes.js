class c_config {
  constructor(args) {
    Object.keys(args).forEach((o) => {
      this[o] = args[o];
    });
  }
}

class PieceBag {
  constructor(pieces) {
    this.pieces = pieces;
    this.bag = [];
    this.refill();
  }

  refill() {
    this.bag.push(...this.pieces.sort(() => Math.random() - 0.5));
  }

  next() {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop();
  }
}
