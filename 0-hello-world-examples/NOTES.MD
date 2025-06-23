

## Transcribe

`transcribe.py` will turn voice into text. Hold down the space bar while speaking to transcribe that text. The first time you run the script, it will download the model, but then it will be cached and you wont have to download it again.

```
python transcribe.py
```

## MCP

`mcp-server.py` is an MCP server you can investigate with the MCP dev tool. Note that you have to comment out the `mcp.run(transport="sse")` line if you want to run the dev tool, and uncomment when you want to run the server.

### Dev tool

Make sure the run line is commented out.

```
mcp dev mcp-server.py
```

And go to the link with the token included, then click on "tools" and "get_tools". You should be able to interact with the server this way to make sure everything is working.

### Agent

Make sure the run line is not commented out.

```
mcp run mcp-server.py
```

Then run the agent script to have the openai agent ue the MCP server. Note that you will need an openai key and some credits. When you have your key, use `export OPENAI_API_KEY="your key"` in the terminal, then the agent script will work.

```
python openai-agent.py
```