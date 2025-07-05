

class NoFlyZone {
    constructor(id, lower_left_corner, upper_right_corner) {
        this.id = id;
        this.lower_left_corner = lower_left_corner;
        this.upper_right_corner = upper_right_corner;
        this.color = color(200, 0, 0);
    }

    display() {
        fill(200, 0, 0, 100);
        stroke(100);
        strokeWeight(1);
        rectMode(CORNERS);
        rect(this.lower_left_corner.x, this.lower_left_corner.y,
            this.upper_right_corner.x, this.upper_right_corner.y);
        display_id("No-Fly Zone " + this.id,
            (this.lower_left_corner.x + this.upper_right_corner.x) / 2,
            (this.lower_left_corner.y + this.upper_right_corner.y) / 2 - 10);
    }
}