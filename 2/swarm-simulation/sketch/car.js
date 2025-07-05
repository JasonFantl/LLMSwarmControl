
class MapObject {
    constructor(id, position) {
        this.id = id;
        this.position = position; // Position is a p5.Vector
    }
}

class Car extends MapObject {
    constructor(id, position, waypoints, speed) {
        super(id, position);
        this.waypoints = waypoints; // Array of waypoints (p5.Vectors)
        this.currentWaypointIndex = 0; // Index of the current waypoint
        this.speed = speed; // Speed of the car
        this.size = 5; // Size of the car
        this.color = color(random(255), random(255), random(255)); // Random color for the car
    }

    update() {
        let target = this.waypoints[this.currentWaypointIndex];
        let direction = p5.Vector.sub(target, this.position);
        let distance = direction.mag();

        if (distance < this.size) {
            // If close to the waypoint, move to the next one
            this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
        } else {
            // Move towards the current waypoint
            direction.setMag(this.speed);
            this.position.add(direction);
        }
    }
    display() {
        // Calculate direction to next waypoint
        let target = this.waypoints[this.currentWaypointIndex];
        let direction = p5.Vector.sub(target, this.position);
        let angle = direction.heading();

        push();
        translate(this.position.x, this.position.y);
        rotate(angle);
        rectMode(CENTER);

        // wheels
        fill(0);
        noStroke();
        rect(this.size, 0, this.size, this.size * 2.5);
        rect(-this.size, 0, this.size, this.size * 2.5);

        // body
        fill(this.color);
        stroke(0);
        strokeWeight(1);
        rect(0, 0, this.size * 3, this.size * 1.5);

        pop();

        display_id("Car " + this.id, this.position.x, this.position.y - this.size * 3);
    }
}