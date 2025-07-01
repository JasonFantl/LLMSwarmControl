drones = [];
swarms = [];
cars = [];

const display_modes = Object.freeze({
  SWARM_ASSIGNMENT: "Swarm assignment",
  DRONE_SPECIALIZATION: "Drone specialization",
});

let display_mode = display_modes.SWARM_ASSIGNMENT;

function setup() {
  createCanvas(600, 600);

  // create some dummy swarms, drones, and cars
  for (let i = 0; i < 3; i++) {
    let swarm = new Swarm(generate_next_id(), new TargetMarker(createVector(random(width), random(height))));
    swarms.push(swarm);
  }

  const drone_specializations_list = Object.values(drone_specializations);
  for (let i = 0; i < 1000; i++) {
    let drone_specialization = drone_specializations_list[i % drone_specializations_list.length];
    let drone = new Drone(createVector(random(width), random(height)), drone_specialization, swarms[i % swarms.length]);
    if (drone_specialization == drone_specializations.DECOY) {
      drone.decoy_specialization = drone_specializations_list[i % (drone_specializations_list.length - 1)];
    }
    drones.push(drone);
  }

  for (let i = 0; i < 2; i++) {
    // create 6 random waypoints per car
    waypoints = [];
    for (let j = 0; j < 6; j++) {
      waypoints.push(createVector(random(width), random(height)));
    }
    let car = new Car(generate_next_id(), createVector(random(width), random(height)), waypoints, 0.5);
    cars.push(car);
  }

  // for testing, attach a swarm to a car
  assign_swarm_to_follow(swarms[0].id, cars[0].id);

  assign_swarm_to_waypoints(swarms[1].id, [[100, 100], [200, 100], [200, 200], [100, 200]], true);

}

function draw() {
  background(255);


  // update drones
  for (let drone of drones) {
    drone.update();
    drone.display();
  }
  droneGrid = nextDroneGrid; // update the drone grid for the next frame
  nextDroneGrid = {}; // reset the next drone grid

  // update cars
  for (let car of cars) {
    car.update();
    car.display();
  }

  // update swarms
  for (let swarm of swarms) {
    swarm.update();
    swarm.display();
  }

}


function get_entity(id) {
  // Find a drone, swarm, or car by ID
  return swarms.find(s => s.id === id) ||
    cars.find(c => c.id === id);
}

// not publicly exposed, used internally to deallocate a swarm
function deallocate_swarm(swarm_id) {

  // set drones with this swarm to None
  for (let drone of drones) {
    if (drone.swarm && drone.swarm.id === swarm_id) {
      drone.swarm = null; // or set to a default swarm
    }
  }

  let swarm_index = swarms.findIndex(m => m.id === swarm_id);
  if (swarm_index === -1) return false;

  swarms.splice(swarm_index, 1);
  return true;
}

function reassign_drones(source_swarm_id, target_swarm_id, num_drones) {
  let from_swarm = swarms.find(m => m.id === source_swarm_id);
  let to_swarm = swarms.find(m => m.id === target_swarm_id);
  if (!from_swarm || !to_swarm) return false;

  let drones_to_reassign = drones.filter(d => d.swarm && d.swarm.id === source_swarm_id).slice(0, num_drones);
  for (let drone of drones_to_reassign) {
    drone.swarm = to_swarm;
  }

  return drones_to_reassign.length; // the number of drones reassigned
}

// moves all drones from the source swarm to the target swarm
function merge_swarm(source_swarm_id, target_swarm_id) {
  let from_swarm = swarms.find(m => m && m.id === source_swarm_id);

  reassign_drones(source_swarm_id, target_swarm_id, from_swarm.num_drones);
  deallocate_swarm(source_swarm_id);

  return target_swarm_id; // id of the swarm after merging
}

// internal, not exposed the MCP
function fork_swarm_to(source_swarm_id, num_drones, target) {
  let source_swarm = swarms.find(m => m.id === source_swarm_id);

  let new_swarm = source_swarm.copy(generate_next_id());

  new_swarm.target = target;
  swarms.push(new_swarm);

  // Reassign drones from the original swarm to the new swarm
  reassign_drones(source_swarm_id, new_swarm.id, num_drones);

  return new_swarm.id; // id of new swarm
}

function fork_swarm_to_follow(source_swarm_id, num_drones, target_id) {
  return fork_swarm_to(source_swarm_id, num_drones, get_entity(target_id));
}

function fork_swarm_to_position(source_swarm_id, num_drones, x, y) {
  return fork_swarm_to(source_swarm_id, num_drones, new TargetMarker(createVector(x, y)));
}

function fork_swarm_to_waypoints(source_swarm_id, num_drones, waypoints, cycle) {
  return fork_swarm_to(source_swarm_id, num_drones, new WayPoints(
    waypoints.map(coords => new TargetMarker(createVector(coords["x"], coords["y"]))), cycle
  ));
}

// internal, nto exposed to MCP
function assign_swarm_to(swarm_id, target) {
  let swarm = swarms.find(m => m.id === swarm_id);
  swarm.target = target;
  return true;
}

function assign_swarm_to_follow(swarm_id, target_id) {
  return assign_swarm_to(swarm_id, get_entity(target_id));
}

function assign_swarm_to_position(swarm_id, x, y) {
  return assign_swarm_to(swarm_id, new TargetMarker(createVector(x, y)));
}

function assign_swarm_to_waypoints(swarm_id, waypoints, cycle) {
  return assign_swarm_to(swarm_id, new WayPoints(
    waypoints.map(coords => new TargetMarker(createVector(coords["x"], coords["y"]))), cycle
  ));
}

// Set the encircling state and radius for a swarm. This can also be used to just update the radius for a swarm already in the encircling state.
function set_swarm_encircle(swarm_id, is_encircling, radius) {
  let swarm = swarms.find(m => m.id === swarm_id);
  swarm.is_encircling = is_encircling; // Set the encircling state
  swarm.radius = radius; // Set the encircling radius
  return swarm.is_encircling;
}

function keyPressed() {
  if (key === '1') {
    display_mode = display_modes.SWARM_ASSIGNMENT;
  } else if (key === '2') {
    display_mode = display_modes.DRONE_SPECIALIZATION;
  }
}