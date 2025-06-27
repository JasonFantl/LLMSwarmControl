class Drone extends MapObject {
    constructor(id, position, swarm) {
        super(id, position);
        this.velocity = createVector(); // Velocity is a p5.Vector
        this.swarm = swarm; // swarm is an object with the target position
        this.size = 5; // Size of the drone
        this.speed = 1; // Speed of the drone
    }

    update() {

        // if no swarm, stay still
        if (!this.swarm) {
            this.velocity.set(0, 0);
            return;
        }

        // Boids parameters
        const separationDist = 20;
        const alignmentDist = 60;
        const cohesionDist = 60;
        const separationWeight = 5.0;
        const alignmentWeight = 0.1;
        const cohesionWeight = 0.5;
        const seekWeight = 2.0;

        let separation = createVector();
        let alignment = createVector();
        let cohesion = createVector();
        let totalSep = 0,
            totalAli = 0,
            totalCoh = 0;

        for (let other of drones) {
            if (other === this) continue;
            let d = p5.Vector.dist(this.position, other.position);
            if (d < separationDist) {
                let diff = p5.Vector.sub(this.position, other.position);
                diff.normalize();
                diff.div(d); // Weight by distance
                separation.add(diff);
                totalSep++;
            }
            if (d < alignmentDist) {
                alignment.add(other.velocity);
                totalAli++;
            }
            if (d < cohesionDist) {
                cohesion.add(other.position);
                totalCoh++;
            }
        }
        if (totalSep > 0) separation.div(totalSep);
        if (totalAli > 0) {
            alignment.div(totalAli);
            alignment.setMag(this.speed);
            alignment.sub(this.velocity);
            alignment.limit(0.1);
        }
        if (totalCoh > 0) {
            cohesion.div(totalCoh);
            cohesion = p5.Vector.sub(cohesion, this.position);
            cohesion.setMag(this.speed);
            cohesion.sub(this.velocity);
            cohesion.limit(0.1);
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
        steer.add(cohesion.mult(cohesionWeight));
        steer.add(seek.mult(seekWeight));
        this.velocity.add(steer);
        this.velocity.limit(this.speed);
        this.position.add(this.velocity);
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