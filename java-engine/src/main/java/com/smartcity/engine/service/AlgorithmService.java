package com.smartcity.engine.service;

import com.smartcity.engine.algorithms.Dijkstra;
import com.smartcity.engine.algorithms.Kruskal;
import com.smartcity.engine.model.MstRequest;
import com.smartcity.engine.model.MstResponse;
import com.smartcity.engine.model.PathRequest;
import com.smartcity.engine.model.PathResponse;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AlgorithmService {

    // Default graph for traffic intersections (Node 1 to Node 5)
    private final Map<String, List<Dijkstra.Edge>> defaultTrafficGraph = new HashMap<>();
    private final List<Kruskal.Edge> defaultUtilityEdges = new ArrayList<>();
    private final List<String> defaultUtilityNodes = Arrays.asList("SubstationA", "ReservoirB", "DistributaryC", "StationD", "GridE");

    public AlgorithmService() {
        // Initialize Default Shortest Path Graph
        // Connections: Node1 <-> Node2 (weight 4), Node1 <-> Node3 (weight 2), Node2 <-> Node3 (weight 1), Node2 <-> Node4 (weight 5), Node3 <-> Node4 (weight 8), Node3 <-> Node5 (weight 10), Node4 <-> Node5 (weight 2), etc.
        addEdge(defaultTrafficGraph, "Node1", "Node2", 4.0);
        addEdge(defaultTrafficGraph, "Node1", "Node3", 2.0);
        addEdge(defaultTrafficGraph, "Node2", "Node3", 1.0);
        addEdge(defaultTrafficGraph, "Node2", "Node4", 5.0);
        addEdge(defaultTrafficGraph, "Node3", "Node4", 8.0);
        addEdge(defaultTrafficGraph, "Node3", "Node5", 10.0);
        addEdge(defaultTrafficGraph, "Node4", "Node5", 2.0);

        // Initialize Default Spanning Tree layout connections
        defaultUtilityEdges.add(new Kruskal.Edge("SubstationA", "ReservoirB", 15.0));
        defaultUtilityEdges.add(new Kruskal.Edge("SubstationA", "DistributaryC", 20.0));
        defaultUtilityEdges.add(new Kruskal.Edge("ReservoirB", "DistributaryC", 5.0));
        defaultUtilityEdges.add(new Kruskal.Edge("ReservoirB", "StationD", 35.0));
        defaultUtilityEdges.add(new Kruskal.Edge("DistributaryC", "StationD", 10.0));
        defaultUtilityEdges.add(new Kruskal.Edge("DistributaryC", "GridE", 40.0));
        defaultUtilityEdges.add(new Kruskal.Edge("StationD", "GridE", 8.0));
    }

    private void addEdge(Map<String, List<Dijkstra.Edge>> graph, String u, String v, double w) {
        graph.computeIfAbsent(u, k -> new ArrayList<>()).add(new Dijkstra.Edge(v, w));
        graph.computeIfAbsent(v, k -> new ArrayList<>()).add(new Dijkstra.Edge(u, w)); // Undirected
    }

    public PathResponse getShortestPath(PathRequest request) {
        Map<String, List<Dijkstra.Edge>> graph = defaultTrafficGraph;

        // If custom edges are provided, build the graph from request
        if (request.getCustomEdges() != null && !request.getCustomEdges().isEmpty()) {
            graph = new HashMap<>();
            for (PathRequest.EdgeInput edge : request.getCustomEdges()) {
                addEdge(graph, edge.getSource(), edge.getTarget(), edge.getWeight());
            }
        }

        // 1. Run Dijkstra benchmark
        long startDijkstra = System.nanoTime();
        Dijkstra.PathResult dijkstraResult = Dijkstra.findShortestPath(graph, request.getStartNode(), request.getEndNode());
        long endDijkstra = System.nanoTime();
        double dijkstraTimeMs = (endDijkstra - startDijkstra) / 1_000_000.0;
        String dijkstraTime = String.format("%.4f ms", dijkstraTimeMs);

        // 2. Build A* Graph and Run A* benchmark
        Map<String, List<com.smartcity.engine.algorithms.AStar.Edge>> astarGraph = new HashMap<>();
        for (Map.Entry<String, List<Dijkstra.Edge>> entry : graph.entrySet()) {
            List<com.smartcity.engine.algorithms.AStar.Edge> astarEdges = new ArrayList<>();
            for (Dijkstra.Edge edge : entry.getValue()) {
                astarEdges.add(new com.smartcity.engine.algorithms.AStar.Edge(edge.target, edge.weight));
            }
            astarGraph.put(entry.getKey(), astarEdges);
        }

        long startAStar = System.nanoTime();
        com.smartcity.engine.algorithms.AStar.PathResult astarResult = 
            com.smartcity.engine.algorithms.AStar.findShortestPath(astarGraph, request.getStartNode(), request.getEndNode());
        long endAStar = System.nanoTime();
        double astarTimeMs = (endAStar - startAStar) / 1_000_000.0;
        String astarTime = String.format("%.4f ms", astarTimeMs);

        // 3. Construct comparison mapping
        Map<String, Object> comparison = new HashMap<>();
        
        Map<String, Object> dStats = new HashMap<>();
        dStats.put("path", dijkstraResult.path);
        dStats.put("cost", dijkstraResult.totalCost == Double.MAX_VALUE ? -1.0 : dijkstraResult.totalCost);
        dStats.put("time", dijkstraTime);
        dStats.put("nodesVisited", dijkstraResult.nodesVisited);
        
        Map<String, Object> aStats = new HashMap<>();
        aStats.put("path", astarResult.path);
        aStats.put("cost", astarResult.totalCost == Double.MAX_VALUE ? -1.0 : astarResult.totalCost);
        aStats.put("time", astarTime);
        aStats.put("nodesVisited", astarResult.nodesVisited);

        comparison.put("dijkstra", dStats);
        comparison.put("astar", aStats);

        return new PathResponse(
                dijkstraResult.path,
                dijkstraResult.totalCost == Double.MAX_VALUE ? -1.0 : dijkstraResult.totalCost,
                dijkstraTime,
                dijkstraResult.nodesVisited,
                comparison
        );
    }

    public MstResponse getMinimumSpanningTree(MstRequest request) {
        long startTime = System.nanoTime();

        List<String> nodes = defaultUtilityNodes;
        List<Kruskal.Edge> edges = defaultUtilityEdges;

        if (request.getNodeIds() != null && !request.getNodeIds().isEmpty()) {
            nodes = request.getNodeIds();
        }

        if (request.getCustomEdges() != null && !request.getCustomEdges().isEmpty()) {
            edges = request.getCustomEdges().stream()
                    .map(e -> new Kruskal.Edge(e.getSource(), e.getTarget(), e.getWeight()))
                    .collect(Collectors.toList());
        }

        Kruskal.MstResult result = Kruskal.computeMST(nodes, edges);

        List<MstResponse.EdgeOutput> outputEdges = result.mstEdges.stream()
                .map(e -> new MstResponse.EdgeOutput(e.source, e.target, e.weight))
                .collect(Collectors.toList());

        long endTime = System.nanoTime();
        String execTime = String.format("%.3f ms", (endTime - startTime) / 1_000_000.0);

        return new MstResponse(outputEdges, result.totalCost, execTime);
    }
}
