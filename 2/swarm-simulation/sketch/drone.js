// --- Spatial grid for boids optimization ---
const boids_distance = 20;
let droneGrid = {};
let nextDroneGrid = {};
let gridCellSize = boids_distance;

function getGridKey(x, y) {
    return `${Math.floor(x / gridCellSize)},${Math.floor(y / gridCellSize)}`;
}

function getNeighbors(drone) {
    let neighbors = [];
    let gx = Math.floor(drone.position.x / gridCellSize);
    let gy = Math.floor(drone.position.y / gridCellSize);
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            let key = `${gx + dx},${gy + dy}`;
            if (droneGrid[key]) {
                neighbors.push(...droneGrid[key]);
            }
        }
    }
    return neighbors;
}

class Drone {
    constructor(position, swarm) {
        this.position = position; // Position is a p5.Vector
        this.velocity = createVector(); // Velocity is a p5.Vector
        this.swarm = swarm; // swarm is an object with the target position
        this.size = 2; // Size of the drone
        this.speed = 1; // Speed of the drone
    }

    update() {
        // if no swarm, stay still
        if (!this.swarm) {
            this.velocity.set(0, 0);
        } else {

            // Boids parameters
            const separationWeight = 1.0;
            const alignmentWeight = -0.1;
            const seekWeight = 3.0;

            let separation = createVector();
            let alignment = createVector();

            // Use grid to get neighbors
            const neighbors = getNeighbors(this);
            let separationCount = 0;
            let alignmentCount = 0;

            for (const other of neighbors) {
                if (other === this) continue;

                const dx = this.position.x - other.position.x;
                const dy = this.position.y - other.position.y;
                const distSq = dx * dx + dy * dy;
                const minDistSq = (2 * this.size) * (2 * this.size);
                const maxDistSq = boids_distance * boids_distance;

                if (distSq < maxDistSq) {
                    let diff = p5.Vector.sub(this.position, other.position);

                    if (distSq < minDistSq) {
                        // Strong repulsion if too close
                        diff.setMag(9999999);
                    } else {
                        // Normal separation force, inversely proportional to distance
                        diff.setMag((maxDistSq - minDistSq) / Math.abs(distSq - minDistSq) - 1);
                    }
                    separation.add(diff);
                    separationCount++;

                    alignment.add(other.velocity);
                    alignmentCount++;
                }
            }

            if (separationCount > 0) separation.div(separationCount);
            if (alignmentCount > 0) {
                alignment.div(alignmentCount);
                alignment.setMag(this.speed);
                alignment.sub(this.velocity);
                alignment.limit(0.1);
            }

            // Seek swarm target with strength decreasing as drone gets closer
            let seek = p5.Vector.sub(this.swarm.target.position, this.position);
            let d = seek.mag();
            let strength = 0;
            if (this.swarm.is_encircling) {
                if (d < this.swarm.radius) {
                    strength = -constrain((this.swarm.radius - d) / 10, 0, 1);
                } else {
                    strength = constrain((d - this.swarm.radius) / 100, 0, 1);
                }
            } else {
                strength = constrain(d / 200, 0, 1);
            }

            strength *= 0.5;

            seek.setMag(this.speed).mult(strength);

            // Combine all forces
            let steer = createVector();
            steer.add(separation.mult(separationWeight));
            steer.add(alignment.mult(alignmentWeight));
            steer.add(seek.mult(seekWeight));
            this.velocity.add(steer);
            this.velocity.limit(this.speed);
            this.position.add(this.velocity);
        }

        // update grid for boids
        let key = getGridKey(this.position.x, this.position.y);
        if (!nextDroneGrid[key]) nextDroneGrid[key] = [];
        nextDroneGrid[key].push(this);
    }

    display() {
        // Set color based on swarm (if swarm has a color property, else default)
        if (this.swarm) {
            fill(this.swarm.color);
        } else {
            fill(150, 150, 150); // Default color if no swarm
        }

        noStroke();
        push();
        translate(this.position.x, this.position.y);
        // Rotate in direction of velocity
        rotate(this.velocity.heading());
        // Draw triangle (drone)
        beginShape();
        vertex(this.size, 0);
        vertex(-this.size * 0.5, this.size * 0.5);
        vertex(-this.size * 0.5, -this.size * 0.5);
        endShape(CLOSE);
        pop();
    }
}
