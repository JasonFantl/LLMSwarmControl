
function draw_cross(x, y, size, angle, fill_color, stroke_color) {
    // show X for the target position and a circle for the current position
    fill(fill_color);
    push();
    translate(x, y);
    rotate(angle);
    noStroke();
    // Draw colored cross with black outline at target position
    stroke(stroke_color);
    strokeWeight(size / 5);
    line(-size / 2, 0, size / 2, 0);
    line(0, -size / 2, 0, size / 2);
    stroke(fill_color);
    strokeWeight(size / 5 - 1);
    line(-size / 2, 0, size / 2, 0);
    line(0, -size / 2, 0, size / 2);
    pop();
}

function display_id(id, x, y) {
    fill(0);
    noStroke();
    textSize(12);
    textAlign(CENTER, CENTER);
    text(id, x, y);
}

function draw_grid(resolution) {

    let line_sizes = [0.2, 0.1];

    for (let i = resolution; i < width; i += resolution) {

        strokeWeight(line_sizes[(i / resolution) % line_sizes.length]);

        stroke(100);

        // horizontal line
        line(i, 0, i, height);

        // vertical line
        line(0, i, width, i);

        // coordinates
        fill(0);
        noStroke();
        textSize(8);
        textAlign(CENTER, CENTER);
        text(i + "x", i, 10);
        text(i + "x", i, height - 10);

        textAlign(LEFT, CENTER);
        text(i + "y", 10, i);
        textAlign(RIGHT, CENTER);
        text(i + "y", width - 10, i);

    }
}