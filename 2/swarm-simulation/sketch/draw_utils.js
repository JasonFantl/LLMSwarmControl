
function draw_cross(x, y, size, fill_color, stroke_color) {
    // show X for the target position and a circle for the current position
    fill(fill_color);
    push();
    translate(x, y);
    rotate(radians(45));
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
    textAlign(CENTER, CENTER);
    text(id, x, y);
}