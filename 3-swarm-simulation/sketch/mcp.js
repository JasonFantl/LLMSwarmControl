const functionRegistry = {
    get_environment,
    reassign_drones,
    merge_swarm,
    fork_swarm_to_follow,
    fork_swarm_to_position,
    assign_swarm_to_follow,
    assign_swarm_to_position,
    set_swarm_encircle,
};

const argOrder = {
    get_environment: [],
    reassign_drones: ["source_swarm_id", "target_swarm_id", "num_drones"],
    merge_swarm: ["source_swarm_id", "target_swarm_id"],
    fork_swarm_to_follow: ["source_swarm_id", "num_drones", "target_id"],
    fork_swarm_to_position: ["source_swarm_id", "num_drones", "x", "y"],
    assign_swarm_to_follow: ["swarm_id", "target_id"],
    assign_swarm_to_position: ["swarm_id", "x", "y"],
    set_swarm_encircle: ["swarm_id", "is_encircling", "radius"],
};

function setupNetwork(functionRegistry) {
    const ws = new WebSocket("ws://localhost:8765");
    ws.onopen = () => {
        ws.send(JSON.stringify({ role: "browser" }));
    };
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        let result;
        if (functionRegistry[msg.command]) {
            console.log("Received command:", msg.command, "with args:", msg.args);
            // Convert args object to ordered array
            let argsArr = [];
            if (msg.args && argOrder[msg.command]) {
                argsArr = argOrder[msg.command].map(k => msg.args[k]);
            }
            result = functionRegistry[msg.command](...argsArr);
        } else {
            result = { error: "Unknown command" };
        }
        ws.send(JSON.stringify({ result }));
    };
}

setupNetwork(functionRegistry);