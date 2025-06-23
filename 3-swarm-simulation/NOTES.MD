Ok, a lot of moving parts here.


Start with the bridge between the MCP server and the p5js sketch running in the browser.

```
node ws_server.js
```

Then start the p5js server in the browser (NOTE: you MUST open this first since all this is super hacky), you should see the bridge console print that the browser connected.

Then start the MCP server, it will connect to the bridge once you make your first tool call.

```
mcp dev canvas-mcp.py
```

Now you can use the inspector to check that the MCP server can interact with the p5js canvas.

Now we can actually run the server and use the text-to-agent, same as before.
