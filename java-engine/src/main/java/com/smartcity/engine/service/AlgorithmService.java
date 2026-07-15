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
        long startTime = System.nanoTime();

        Map<String, List<Dijkstra.Edge>> graph = defaultTrafficGraph;

        // If custom edges are provided, build the graph from request
        if (request.getCustomEdges() != null && !request.getCustomEdges().isEmpty()) {
            graph = new HashMap<>();
            for (PathRequest.EdgeInput edge : request.getCustomEdges()) {
                addEdge(graph, edge.getSource(), edge.getTarget(), edge.getWeight());
            }
        }

        Dijkstra.PathResult result = Dijkstra.findShortestPath(graph, request.getStartNode(), request.getEndNode());

        long endTime = System.nanoTime();
        String execTime = String.format("%.3f ms", (endTime - startTime) / 1_000_000.0);

        return new PathResponse(
                result.path,
                result.totalCost == Double.MAX_VALUE ? -1.0 : result.totalCost,
                execTime
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
