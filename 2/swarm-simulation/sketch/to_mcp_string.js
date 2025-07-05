// Assuming these classes are globally available or imported

function describePosition(position) {
    return { x: Math.round(position.x), y: Math.round(position.y) };
}

TargetMarker.prototype.describe = function (depth) {
    return {
        type: "coordinate",
        position: describePosition(this.position)
    };
};

Landmark.prototype.describe = function (depth) {
    return {
        type: "landmark",
        id: this.id,
        position: describePosition(this.position)
    };
};

WayPoints.prototype.describe = function (depth) {
    let waypoint_descriptions = [];
    for (let waypoint of this.waypoints) {
        waypoint_descriptions.push(waypoint.describe(depth + 1));
    }
    return {
        type: "waypoints",
        waypoints: waypoint_descriptions
    }
};

Car.prototype.describe = function (depth) {
    return {
        type: "car",
        id: this.id,
        position: describePosition(this.position),
    };
};

Swarm.prototype.describe = function (depth) {

    let desc = {
        type: "swarm",
        id: this.id,
    };

    // only describe the full details of the swarm if this is the main description, helps avoid recursion (when two swarms are following each other)
    if (depth == 0) {
        desc = {
            type: "swarm",
            id: this.id,
            center_of_mass: describePosition(this.position),
            num_drones: this.num_drones,
            num_drone_specializations: this.num_drone_specializations,
            target: this.target.describe(depth + 1),
            is_encircling: this.is_encircling
        };
        if (this.is_encircling) {
            desc.radius = this.radius;
        }
    }
    return desc;
};
