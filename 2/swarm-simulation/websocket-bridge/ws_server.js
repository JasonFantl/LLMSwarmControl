const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8765 });

const connections = {};

wss.on("connection", (socket) => {
    let role = null;

    socket.once("message", (msg) => {
        try {
            const reg = JSON.parse(msg.toString());
            if (reg.role === "browser" || reg.role === "python") {
                role = reg.role;
                connections[role] = socket;
                console.log(`${role} connected.`);
            } else {
                socket.close();
                return;
            }
        } catch {
            socket.close();
            return;
        }

        if (role === "python") {
            socket.on("message", (msg) => {
                if (!connections.browser) {
                    socket.send(JSON.stringify({ error: "No browser connected" }));
                    return;
                }
                console.log(`[IN] from agent:`, msg.toString()); // Log incoming from agent
                connections.browser.send(msg.toString());
                connections.browser.once("message", (response) => {
                    console.log(`[OUT] to agent:`, response.toString()); // Log outgoing to agent
                    socket.send(response.toString());
                });
            });
        }
    });

    socket.on("close", () => {
        if (role) {
            console.log(`${role} disconnected.`);
            if (connections[role] === socket) {
                delete connections[role];
            }
        }
    });
});