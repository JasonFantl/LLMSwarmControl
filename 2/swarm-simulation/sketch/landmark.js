

class Landmark extends MapObject {
    constructor(id, position) {
        super(id, position);
        this.size = 10;
    }

    display() {
        draw_cross(this.position.x, this.position.y, this.size, 100, 0);
        display_id("Landmark " + this.id, this.position.x, this.position.y - this.size * 2);
    }
}