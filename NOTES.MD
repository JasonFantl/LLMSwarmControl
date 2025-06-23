

# Hello World

## MCP inspector (optional)

Make sure not to run the server in the python file when you run the inspector.

```
mcp dev mcp-server.py
```

## Run the MCP server

Make sure the server calls run() in the python file.

```
python mcp-server.py
```

or 

```
mcp run mcp-server.py
```

## Expose the MCP server to the world

```
lt --port 8000  
```

## Run LLM

```
python openai-agent.py
```

# Combined

Start the MCP server from Hello-World and expose it to the world.

Run the transcriber in one terminal and the agent in the other, they will communicate over a named pipe. 