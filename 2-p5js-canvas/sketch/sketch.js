let shapes = [];
let nextId = 1;

const ws = new WebSocket("ws://localhost:8765");

ws.onopen = () => {
  ws.send(JSON.stringify({ role: "browser" }));
};

// Function registry: add new commands here
const functionRegistry = {
  add_circle: ({ x, y, radius = 30, color = "blue" }) => {
    const shape = { id: nextId++, type: "circle", x, y, radius, color };
    shapes.push(shape);
    return shape.id;
  },
  add_square: ({ x, y, size = 40, color = "red" }) => {
    const shape = { id: nextId++, type: "square", x, y, size, color };
    shapes.push(shape);
    return shape.id;
  },
  move_shape: ({ id, x, y }) => {
    const shape = shapes.find(s => s.id === id);
    if (shape) {
      shape.x = x;
      shape.y = y;
      return true;
    }
    return false;
  },
  change_color: ({ id, color }) => {
    const shape = shapes.find(s => s.id === id);
    if (shape) {
      shape.color = color;
      return true;
    }
    return false;
  },
  remove_shape: ({ id }) => {
    const idx = shapes.findIndex(s => s.id === id);
    if (idx !== -1) {
      shapes.splice(idx, 1);
      return true;
    }
    return false;
  },
  get_canvas: () => shapes,
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  let result;
  console.log("Received from server:", msg);
  if (functionRegistry[msg.command]) {
    result = functionRegistry[msg.command](msg.args || {});
  } else {
    result = { error: "Unknown command" };
  }
  ws.send(JSON.stringify({ result }));
};

function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(255);
  for (const shape of shapes) {
    fill(shape.color);
    noStroke();
    if (shape.type === "circle") {
      ellipse(shape.x, shape.y, shape.radius * 2, shape.radius * 2);
    } else if (shape.type === "square") {
      rectMode(CENTER);
      rect(shape.x, shape.y, shape.size, shape.size);
    }
  }
}