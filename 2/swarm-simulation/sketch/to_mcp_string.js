// Assuming these classes are globally available or imported

function get_environment() {
    return {
        swarms: swarms.map(s => s.describe()),
        cars: cars.map(c => c.describe())
    };
}

function describePosition(position) {
    return { x: Math.round(position.x), y: Math.round(position.y) };
}

TargetMarker.prototype.describe = function () {
    return {
        type: "coordinate",
        position: describePosition(this.position)
    };
};

WayPoints.prototype.describe = function () {
    let waypoint_descriptions = [];
    for (let waypoint of this.waypoints) {
        waypoint_descriptions.push(waypoint.describe());
    }
    return {
        type: "waypoints",
        waypoints: waypoint_descriptions
    }
};

Car.prototype.describe = function () {
    return {
        type: "car",
        id: this.id,
        position: describePosition(this.position),
    };
};

Swarm.prototype.describe = function () {
    let desc = {
        type: "swarm",
        id: this.id,
        center_of_mass: describePosition(this.position),
        num_drones: this.num_drones,
        num_drone_specializations: this.num_drone_specializations,
        target: this.target.describe(),
        is_encircling: this.is_encircling
    };
    if (this.is_encircling) {
        desc.radius = this.radius;
    }
    return desc;
};