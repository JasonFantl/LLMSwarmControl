id_counter = 0; // Global counter for IDs


drones = [];
swarms = [];
cars = [];

function setup() {
  createCanvas(600, 600);

  // create some dummy swarms, drones, and cars
  for (let i = 0; i < 3; i++) {
    allocate_swarm_to_position(random(width), random(height));
  }
  for (let i = 0; i < 100; i++) {
    let drone = new Drone(id_counter++, createVector(random(width), random(height)), swarms[i % swarms.length]);
    drones.push(drone);
  }
  for (let i = 0; i < 2; i++) {
    // create 3 random waypoints per car
    waypoints = [];
    for (let j = 0; j < 3; j++) {
      waypoints.push(createVector(random(width), random(height)));
    }
    let car = new Car(id_counter++, createVector(random(width), random(height)), waypoints, 0.5);
    cars.push(car);
  }

  // for testing, attach a swarm to a car
  set_swarm_target(swarms[0].id, cars[0].id);
}

function draw() {
  background(255);


  // update drones
  for (let drone of drones) {
    drone.update();
    drone.display();
  }

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
  return drones.find(d => d.id === id) ||
    swarms.find(s => s.id === id) ||
    cars.find(c => c.id === id);
}

function get_environment() {
  return {
    "swarms": swarms,
    // "drones": drones,
    "cars": cars
  };
}

// Allocate a new swarm with a target object, which it will follow
function allocate_swarm(target_id) {
  let target = get_entity(target_id);
  let swarm = new Swarm(id_counter++, target);
  swarms.push(swarm);
  return swarm.id;
}

// Allocate a new swarm with a new target marker at a specific position
function allocate_swarm_to_position(x, y) {

  let swarm = new Swarm(id_counter++, new TargetMarker(createVector(x, y)));
  swarms.push(swarm);
  return swarm.id;
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

function reassign_drones(from_swarm_id, to_swarm_id, num_drones) {
  print("Reassigning drones from swarm", from_swarm_id, "to swarm", to_swarm_id, "number of drones:", num_drones);
  let from_swarm = swarms.find(m => m.id === from_swarm_id);
  let to_swarm = swarms.find(m => m.id === to_swarm_id);
  if (!from_swarm || !to_swarm) return false;

  let drones_to_reassign = drones.filter(d => d.swarm && d.swarm.id === from_swarm_id).slice(0, num_drones);
  for (let drone of drones_to_reassign) {
    drone.swarm = to_swarm;
  }
  return true;
}

function merge_swarm(from_swarm_id, to_swarm_id) {
  let from_swarm = swarms.find(m => m && m.id === from_swarm_id);
  reassign_drones(from_swarm_id, to_swarm_id, from_swarm.num_drones);
  deallocate_swarm(from_swarm_id);

  return true;
}

function fork_swarm(from_swarm_id, num_drones, target_id) {
  // Create a new swarm with the specified target
  let target = get_entity(target_id);
  let new_swarm = new Swarm(id_counter++, target);
  swarms.push(new_swarm);

  // Reassign drones from the original swarm to the new swarm
  reassign_drones(from_swarm_id, new_swarm.id, num_drones);

  return new_swarm.id;
}

function fork_swarm_to_position(from_swarm_id, num_drones, x, y) {
  // Create a new swarm at the specified position
  let new_swarm_id = allocate_swarm_to_position(x, y);

  // Reassign drones from the original swarm to the new swarm
  reassign_drones(from_swarm_id, new_swarm_id, num_drones);

  return new_swarm_id;
}

function set_swarm_target(swarm_id, target_id) {
  let swarm = swarms.find(m => m.id === swarm_id);
  let target = get_entity(target_id);
  if (!swarm || !target) {
    return false;
  }
  swarm.target = target;
  return true;
}

function set_swarm_to_position(swarm_id, x, y) {
  let swarm = swarms.find(m => m.id === swarm_id);
  if (!swarm) {
    return false; // Swarm not found
  }

  swarm.target = new TargetMarker(createVector(x, y)); // Set a new target marker at the specified position
  return true;
}

// For debugging purposes - updated to use newer swarm functions
function mousePressed() {
  if (key === 'a') {
    let new_id = allocate_swarm_to_position(mouseX, mouseY);
    console.log('Added swarm', new_id, 'at', mouseX, mouseY);
  } else if (key === 'm' && swarms.length >= 2) {
    let from_id = swarms[0].id;
    let to_id = swarms[1].id;
    merge_swarm(from_id, to_id);
    console.log('Merged swarm', from_id, 'into', to_id);
  } else if (key === 'f' && swarms.length > 0) {
    let from_id = swarms[0].id;
    let new_id = fork_swarm_to_position(from_id, 5, mouseX, mouseY);
    console.log('Forked swarm', from_id, 'to new swarm', new_id, 'at', mouseX, mouseY);
  } else if (key === 't' && swarms.length > 0) {
    let swarm_id = swarms[0].id;
    set_swarm_to_position(swarm_id, mouseX, mouseY);
    console.log('Moved swarm', swarm_id, 'target to', mouseX, mouseY);
  } else if (key === 'd' && swarms.length > 1) {
    let from_id = swarms[0].id;
    let to_id = swarms[1].id;
    reassign_drones(from_id, to_id, 10);
    console.log('Reassigned 10 drones from swarm', from_id, 'to', to_id);
  }
}
