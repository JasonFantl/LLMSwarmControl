const functionRegistry = {
    add_circle,
    add_square,
    move_shape,
    change_color,
    remove_shape,
    get_canvas,
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
            result = functionRegistry[msg.command](msg.args || {});
        } else {
            result = { error: "Unknown command" };
        }
        ws.send(JSON.stringify({ result }));
    };
}

setupNetwork(functionRegistry);