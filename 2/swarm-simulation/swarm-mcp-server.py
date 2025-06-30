# python_mcp_server.py
import asyncio
import websockets
import json
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Swarm Simulation MCP")

WS_URI = "ws://localhost:8765"


async def send_to_browser(cmd, args=None):
    async with websockets.connect(WS_URI) as ws:
        # Register as python client
        await ws.send(json.dumps({"role": "python"}))
        await ws.send(json.dumps({"command": cmd, "args": args}))
        reply = await ws.recv()
        return json.loads(reply)["result"]


@mcp.tool()
async def get_environment() -> dict:
    """
    Get the current environment state, including all swarms and entities.
    Returns:
        dict: The current environment state with swarms and entities.
    Usage:
        Use this tool to retrieve the full state of the simulation environment, including all active swarms and entities.
    Effect:
        Returns a dictionary containing the current state of the environment, which can be used for further processing or analysis.
    """
    return await send_to_browser("get_environment")


@mcp.tool()
async def reassign_drones(
    source_swarm_id: str, target_swarm_id: str, num_drones: int
) -> int:
    """
    Reassign a specified number of drones from one swarm to another.
    Args:
        source_swarm_id (str): The ID of the swarm to move drones from.
        target_swarm_id (str): The ID of the swarm to move drones to.
        num_drones (int): The number of drones to reassign.
    Returns:
        int: The number of drones actually reassigned.
    Usage:
        Use this tool to move a subset of drones from one swarm to another, e.g., to split or balance swarms.
    Effect:
        The specified number of drones will be removed from the source swarm and added to the target swarm. If fewer drones are available, only the available drones will be reassigned.
    """
    return await send_to_browser(
        "reassign_drones",
        {
            "source_swarm_id": source_swarm_id,
            "target_swarm_id": target_swarm_id,
            "num_drones": num_drones,
        },
    )


@mcp.tool()
async def merge_swarm(source_swarm_id: str, target_swarm_id: str) -> str:
    """
    Merge all drones from the source swarm into the target swarm and remove the source swarm.
    Args:
        source_swarm_id (str): The ID of the swarm to merge from (will be removed).
        target_swarm_id (str): The ID of the swarm to merge into (will remain).
    Returns:
        str: The ID of the swarm after merging (target_swarm_id).
    Usage:
        Use this tool to combine two swarms into one, consolidating their drones and removing the source swarm.
    Effect:
        All drones from the source swarm are reassigned to the target swarm, and the source swarm is deleted from the environment.
    """
    return await send_to_browser(
        "merge_swarm",
        {"source_swarm_id": source_swarm_id, "target_swarm_id": target_swarm_id},
    )


@mcp.tool()
async def fork_swarm_to_follow(
    source_swarm_id: str, num_drones: int, target_id: str
) -> str:
    """
    Create a new swarm with a specified number of drones from an existing swarm, and assign it to follow a target entity.
    Args:
        source_swarm_id (str): The ID of the swarm to split drones from.
        num_drones (int): The number of drones to assign to the new swarm.
        target_id (str): The ID of the entity for the new swarm to follow.
    Returns:
        str: The ID of the newly created swarm.
    Usage:
        Use this tool to split off a group of drones from an existing swarm and assign them to follow a new target (e.g., a car or another swarm).
    Effect:
        A new swarm is created, the specified number of drones are reassigned to it, and its target is set to the given entity.
    """
    return await send_to_browser(
        "fork_swarm_to_follow",
        {
            "source_swarm_id": source_swarm_id,
            "num_drones": num_drones,
            "target_id": target_id,
        },
    )


@mcp.tool()
async def fork_swarm_to_position(
    source_swarm_id: str, num_drones: int, x: float, y: float
) -> str:
    """
    Create a new swarm with a specified number of drones from an existing swarm, and assign it to a fixed position.
    Args:
        source_swarm_id (str): The ID of the swarm to split drones from.
        num_drones (int): The number of drones to assign to the new swarm.
        x (float): The X coordinate of the new target position.
        y (float): The Y coordinate of the new target position.
    Returns:
        str: The ID of the newly created swarm.
    Usage:
        Use this tool to split off a group of drones from an existing swarm and assign them to a new static position in the environment.
    Effect:
        A new swarm is created, the specified number of drones are reassigned to it, and its target is set to the given (x, y) position.
    """
    return await send_to_browser(
        "fork_swarm_to_position",
        {"source_swarm_id": source_swarm_id, "num_drones": num_drones, "x": x, "y": y},
    )


@mcp.tool()
async def assign_swarm_to_follow(swarm_id: str, target_id: str) -> str:
    """
    Change the target of a swarm to follow a new entity (car, swarm, or marker).
    Args:
        swarm_id (str): The ID of the swarm to update.
        target_id (str): The ID of the new target entity.
    Returns:
        str: The ID of the new target entity.
    Usage:
        Use this tool to redirect a swarm to follow a different car, swarm, or marker.
    Effect:
        The swarm's target is updated to the specified entity, and it will begin moving toward or tracking that entity.
    """
    return await send_to_browser(
        "assign_swarm_to_follow", {"swarm_id": swarm_id, "target_id": target_id}
    )


@mcp.tool()
async def assign_swarm_to_position(swarm_id: str, x: float, y: float) -> dict:
    """
    Change the target of a swarm to a new fixed position in the environment.
    Args:
        swarm_id (str): The ID of the swarm to update.
        x (float): The X coordinate of the new target position.
        y (float): The Y coordinate of the new target position.
    Returns:
        dict: The new target marker object (with position).
    Usage:
        Use this tool to move a swarm's target to a specific (x, y) location in the environment.
    Effect:
        The swarm's target is updated to a new marker at the specified position, and it will move toward that point.
    """
    return await send_to_browser(
        "assign_swarm_to_position", {"swarm_id": swarm_id, "x": x, "y": y}
    )


@mcp.tool()
async def set_swarm_encircle(swarm_id: str, is_encircling: bool, radius: float) -> bool:
    """
    Set whether a swarm should encircle its target, and/or specify the encircling radius.
    Args:
        swarm_id (str): The ID of the swarm to update.
        is_encircling (bool): Whether the swarm should encircle its target (True/False).
        radius (float): The radius of the encircling circle (in pixels or environment units).
    Returns:
        bool: The new encircling state (True if encircling, False otherwise).
    Usage:
        Use this tool to make a swarm encircle its target (e.g., surround a car or marker) or to update the encircling radius.
    Effect:
        The swarm will begin or stop encircling its target, and the radius will be set as specified.
    """
    return await send_to_browser(
        "set_swarm_encircle",
        {"swarm_id": swarm_id, "is_encircling": is_encircling, "radius": radius},
    )


if __name__ == "__main__":
    mcp.run(transport="sse")
