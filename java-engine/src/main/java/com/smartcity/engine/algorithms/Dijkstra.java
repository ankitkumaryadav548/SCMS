package com.smartcity.engine.algorithms;

import java.util.*;

public class Dijkstra {

    public static class Edge {
        public String target;
        public double weight;

        public Edge(String target, double weight) {
            this.target = target;
            this.weight = weight;
        }
    }

    public static class PathResult {
        public List<String> path;
        public double totalCost;
        public int nodesVisited;

        public PathResult(List<String> path, double totalCost, int nodesVisited) {
            this.path = path;
            this.totalCost = totalCost;
            this.nodesVisited = nodesVisited;
        }
    }

    public static PathResult findShortestPath(Map<String, List<Edge>> graph, String start, String end) {
        if (!graph.containsKey(start)) {
            return new PathResult(Collections.emptyList(), Double.MAX_VALUE, 0);
        }

        Map<String, Double> distances = new HashMap<>();
        Map<String, String> predecessors = new HashMap<>();
        PriorityQueue<NodeDistance> pq = new PriorityQueue<>(Comparator.comparingDouble(nd -> nd.distance));

        for (String node : graph.keySet()) {
            distances.put(node, Double.MAX_VALUE);
        }
        distances.put(start, 0.0);
        pq.add(new NodeDistance(start, 0.0));

        int nodesVisited = 0;

        while (!pq.isEmpty()) {
            NodeDistance current = pq.poll();
            String u = current.node;
            nodesVisited++;

            if (u.equals(end)) {
                break;
            }

            if (current.distance > distances.get(u)) {
                continue;
            }

            List<Edge> neighbors = graph.getOrDefault(u, Collections.emptyList());
            for (Edge edge : neighbors) {
                String v = edge.target;
                double weight = edge.weight;
                double newDist = distances.get(u) + weight;

                if (newDist < distances.getOrDefault(v, Double.MAX_VALUE)) {
                    distances.put(v, newDist);
                    predecessors.put(v, u);
                    pq.add(new NodeDistance(v, newDist));
                }
            }
        }

        if (distances.get(end) == null || distances.get(end) == Double.MAX_VALUE) {
            return new PathResult(Collections.emptyList(), Double.MAX_VALUE, nodesVisited);
        }

        List<String> path = new LinkedList<>();
        String step = end;
        while (step != null) {
            path.add(0, step);
            step = predecessors.get(step);
        }

        return new PathResult(path, distances.get(end), nodesVisited);
    }

    private static class NodeDistance {
        String node;
        double distance;

        NodeDistance(String node, double distance) {
            this.node = node;
            this.distance = distance;
        }
    }
}
