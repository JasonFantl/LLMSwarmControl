drones = [];
swarms = [];
cars = [];
landmarks = [];

no_fly_zones = [];

const display_modes = Object.freeze({
  SWARM_ASSIGNMENT: "Swarm assignment",
  DRONE_SPECIALIZATION: "Drone specialization",
});

let display_mode = display_modes.SWARM_ASSIGNMENT;

function setup() {
  createCanvas(600, 600);

  // create some dummy swarms and drones
  for (let i = 0; i < 4; i++) {
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

  // create cars
  for (let i = 0; i < 2; i++) {
    // create 6 random waypoints per car
    waypoints = [];
    for (let j = 0; j < 6; j++) {
      waypoints.push(createVector(random(width), random(height)));
    }
    let car = new Car(generate_next_id(), createVector(random(width), random(height)), waypoints, 1.0);
    cars.push(car);
  }

  // create landmarks
  for (let i = 0; i < 3; i++) {
    let landmark = new Landmark(generate_next_id(), createVector(random(width), random(height)));
    landmarks.push(landmark);
  }


  // create no-fly zones
  let no_fly_zone = new NoFlyZone(generate_next_id(), createVector(300, 300), createVector(500, 400));
  no_fly_zones.push(no_fly_zone);

  // for testing:
  assign_swarm_to_follow(swarms[0].id, cars[0].id);
  assign_swarm_to_waypoints(swarms[1].id, [{ "x": 100, "y": 100 }, { "x": 200, "y": 100 }, { "x": 200, "y": 200 }, { "x": 100, "y": 200 }], true);
  assign_swarm_to_follow(swarms[2].id, landmarks[0].id);

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

  // display landmarks
  for (let landmark of landmarks) {
    landmark.display();
  }

  // display no-fly zones
  for (let no_fly_zone of no_fly_zones) {
    no_fly_zone.display();
  }
}


function get_entity(id) {
  return swarms.find(s => s.id === id) ||
    cars.find(c => c.id === id) ||
    landmarks.find(c => c.id === id);
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

function fork_swarm_to(source_swarm_id, num_drones, target) {
  let source_swarm = swarms.find(m => m.id === source_swarm_id);

  let new_swarm = source_swarm.copy(generate_next_id());

  new_swarm.target = target;
  swarms.push(new_swarm);

  // Reassign drones from the original swarm to the new swarm
  reassign_drones(source_swarm_id, new_swarm.id, num_drones);

  return new_swarm.id; // id of new swarm
}

function assign_swarm_to(swarm_id, target) {
  let swarm = swarms.find(m => m.id === swarm_id);
  swarm.target = target;
  return true;
}

// MPC functions
// =========================

function get_environment() {
  return {
    swarms: swarms.map(s => s.describe(0)),
    cars: cars.map(c => c.describe(0)),
    landmarks: landmarks.map(c => c.describe(0)),
    "no-fly zones": no_fly_zones.map(c => c.describe(0))
  };
}

function reassign_drones(source_swarm_id, target_swarm_id, num_drones) {
  let from_swarm = swarms.find(m => m.id === source_swarm_id);
  let to_swarm = swarms.find(m => m.id === target_swarm_id);
  if (!from_swarm || !to_swarm) return false;

  let drones_from_source = drones.filter(d => d.swarm && d.swarm.id === source_swarm_id);
  let num_original_drones_in_source = drones_from_source.length;
  let drones_to_reassign = drones_from_source.slice(0, num_drones);
  for (let drone of drones_to_reassign) {
    drone.swarm = to_swarm;
  }

  // remove the source swarm if all drones are moved out of it (could this come back to bite me later? LLMs may need to temporarily pass through this state)
  if (drones_to_reassign.length == num_original_drones_in_source) {
    deallocate_swarm(source_swarm_id);
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

// =======================

function keyPressed() {
  if (key === '1') {
    display_mode = display_modes.SWARM_ASSIGNMENT;
  } else if (key === '2') {
    display_mode = display_modes.DRONE_SPECIALIZATION;
  }
}