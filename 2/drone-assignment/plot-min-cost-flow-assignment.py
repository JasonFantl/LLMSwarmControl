# Re-import everything after kernel reset
import numpy as np
import matplotlib.pyplot as plt
import networkx as nx
from scipy.spatial import distance_matrix
import time

# Setup
n = 2000
k = 5
np.random.seed(999)

# uniformly sample points in a circle and centers
r = np.sqrt(np.random.rand(n))
theta = 2 * np.pi * np.random.rand(n)
points = np.stack([r * np.cos(theta), r * np.sin(theta)], axis=1)

centers = np.random.rand(k, 2)

cost_matrix = distance_matrix(points, centers)


def compute_min_cost_flow(cost_matrix, squared=False):
    G = nx.DiGraph()
    for i in range(n):
        G.add_edge("s", f"p{i}", capacity=1, weight=0)
        for j in range(k):
            cost = cost_matrix[i, j] ** 2 if squared else cost_matrix[i, j]
            G.add_edge(f"p{i}", f"c{j}", capacity=1, weight=int(1e4 * cost))
    for j in range(k):
        G.add_edge(f"c{j}", "t", capacity=n // k, weight=0)
    flow_dict = nx.max_flow_min_cost(G, "s", "t")
    assignments = [[] for _ in range(k)]
    for i in range(n):
        for j in range(k):
            if flow_dict[f"p{i}"][f"c{j}"] > 0:
                assignments[j].append(i)
    return assignments


# Run baseline algorithms
row = []
row.append(("Distance", compute_min_cost_flow(cost_matrix, squared=False)))
row.append(("Squared Distance", compute_min_cost_flow(cost_matrix, squared=True)))

# Plot
fig, ax_row = plt.subplots(1, len(row), figsize=(5 * len(row), 10))
for ax, (title, assignments) in zip(ax_row, row):
    for i, group in enumerate(assignments):
        sc = ax.scatter(points[group, 0], points[group, 1], s=5)
        color = sc.get_facecolor()[0]
        ax.scatter(*centers[i], marker="x", s=250, c="black", linewidths=5, zorder=10)
        ax.scatter(*centers[i], marker="x", s=200, c=[color], linewidths=2, zorder=11)
    ax.set_title(f"{title}")
    ax.set_xticks([])
    ax.set_yticks([])
    ax.set_aspect("equal")
plt.tight_layout()
plt.suptitle("Min-Cost Flow Assignment")
plt.show()
