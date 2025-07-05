
marker_display_size = 5; // Size of the markers
swarm_display_size = 15; // Size of the swarm symbols

class TargetMarker {
    constructor(position) {
        this.position = position;
    }
}

class WayPoints {
    constructor(waypoints, cycle) {
        this.waypoints = waypoints;
        this.cycle = cycle;
    }

    get position() {
        return this.waypoints[0].position;
    }

    shift() {
        let first_waypoint = this.waypoints.shift();
        if (this.cycle) {
            this.waypoints.push(first_waypoint)
        }
    }
}

class Swarm extends MapObject {
    constructor(id, target) {
        super(id, target.position); // Call the parent constructor with id and position
        this.target = target; // target only needs to have a position
        this.is_encircling = false; // Whether the swarm is encircling the target
        this.radius = 50; // Radius of the swarm's encircling area
        this.color = color(random(255), random(255), random(255)); // Color of the swarm

        this.num_drones = 0; // Number of drones associated with this swarm
        this.num_drone_specializations = {};
    }

    copy(new_id) {
        // Create a new Swarm with the same target, encircling state, and radius, and with no drones
        let new_swarm = new Swarm(new_id, this.target);
        new_swarm.is_encircling = this.is_encircling;
        new_swarm.radius = this.radius;

        return new_swarm;
    }

    update() {

        // set current position to the average location of all drones with this swarm
        let total = createVector();
        let count = 0;
        let count_specializations = Object.fromEntries(
            Object.values(drone_specializations).map(val => [val, 0])
        );
        for (let drone of drones) {
            if (drone.swarm && drone.swarm.id === this.id) {
                total.add(drone.position);
                count++;
                count_specializations[drone.specialization]++;
            }
        }
        if (count > 0) {
            this.position = total.div(count);
        } else {
            this.position = this.target.position.copy(); // If no drones, current position is target position
        }

        // Update the number of drones associated with this swarm
        this.num_drones = count;
        this.num_drone_specializations = count_specializations;

        // if we are following a waypoint, update when we get close enough to the next waypoint
        if (this.target instanceof WayPoints) {
            let distance = p5.Vector.dist(this.position, this.target.position);
            if (distance < 10) {
                if (this.target.waypoints.length > 1) {
                    this.target.shift(); // move to next waypoint
                } else if (this.target.waypoints.length == 1) {
                    this.target = this.target.waypoints[0]; // replace waypoints with the remaining target
                }
            }
        }
    }

    display() {

        draw_cross(this.target.position.x, this.target.position.y, swarm_display_size, PI / 4, this.color, 0);

        // Draw current position as a colored circle
        strokeWeight(1);
        stroke(0);
        fill(red(this.color), green(this.color), blue(this.color), 127); // 127 is half-transparent
        ellipse(this.position.x, this.position.y, swarm_display_size, swarm_display_size);

        display_id("Swarm " + this.id, this.position.x, this.position.y - marker_display_size * 3);
    }
}