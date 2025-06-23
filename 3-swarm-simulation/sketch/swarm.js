
marker_display_size = 5; // Size of the markers
swarm_display_size = 15; // Size of the swarm symbols

class TargetMarker {
    constructor(position) {
        this.position = position;
    }
}

class Swarm extends MapObject {
    constructor(id, target) {
        super(id, target.position); // Call the parent constructor with id and position
        this.target = target; // target only needs to have a position
        this.color = color(random(255), random(255), random(255)); // Color of the swarm

        this.num_drones = 0; // Number of drones associated with this swarm
    }

    update() {

        // set current position to the average location of all drones with this swarm
        let total = createVector();
        let count = 0;
        for (let drone of drones) {
            if (drone.swarm && drone.swarm.id === this.id) {
                total.add(drone.position);
                count++;
            }
        }
        if (count > 0) {
            this.position = total.div(count);
        } else {
            this.position = this.target.position.copy(); // If no drones, current position is target position
        }

        // Update the number of drones associated with this swarm
        this.num_drones = count;
    }

    display() {

        // show X for the target position and a circle for the current position
        fill(this.color);
        push();
        translate(this.target.position.x, this.target.position.y);
        rotate(radians(45));
        noStroke();
        // Draw colored cross with black outline at target position
        stroke(0);
        strokeWeight(swarm_display_size / 5);
        line(-swarm_display_size / 2, 0, swarm_display_size / 2, 0);
        line(0, -swarm_display_size / 2, 0, swarm_display_size / 2);
        stroke(this.color);
        strokeWeight(swarm_display_size / 5 - 1);
        line(-swarm_display_size / 2, 0, swarm_display_size / 2, 0);
        line(0, -swarm_display_size / 2, 0, swarm_display_size / 2);
        pop();

        // Draw current position as a colored circle
        strokeWeight(1);
        stroke(0);
        fill(red(this.color), green(this.color), blue(this.color), 127); // 127 is half-transparent
        ellipse(this.position.x, this.position.y, swarm_display_size, swarm_display_size);
        // show ID
        fill(0);
        textAlign(CENTER, CENTER);
        text(this.id, this.position.x, this.position.y - 10);
    }
}