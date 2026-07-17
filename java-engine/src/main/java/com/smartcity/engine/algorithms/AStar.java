package com.smartcity.engine.algorithms;

import java.util.*;

public class AStar {

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

    private static final Map<String, double[]> coordinates = new HashMap<>();
    static {
        coordinates.put("TimesSquare", new double[]{28.6304, 77.2177});
        coordinates.put("CentralPark", new double[]{28.6129, 77.2295});
        coordinates.put("GrandCentral", new double[]{28.6429, 77.2217});
        coordinates.put("EmpireState", new double[]{28.6143, 77.2002});
        coordinates.put("UnionSquare", new double[]{28.6444, 77.1903});
        coordinates.put("WashSquare", new double[]{28.6425, 77.1780});
        coordinates.put("SoHo", new double[]{28.6450, 77.1585});
        coordinates.put("WallStreet", new double[]{28.6506, 77.2303});
        coordinates.put("Chinatown", new double[]{28.6562, 77.2410});
        coordinates.put("EastVillage", new double[]{28.6406, 77.2495});
        coordinates.put("ChelseaMarket", new double[]{28.5933, 77.2189});
        coordinates.put("HudsonYards", new double[]{28.5893, 77.2106});
    }

    private static double getHeuristic(String node, String target) {
        double[] c1 = coordinates.getOrDefault(node, new double[]{0.0, 0.0});
        double[] c2 = coordinates.getOrDefault(target, new double[]{0.0, 0.0});
        double latDiff = c1[0] - c2[0];
        double lngDiff = c1[1] - c2[1];
        // Euclidean distance in degrees. Scale by 111 to approximate kilometers
        return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.0;
    }

    public static PathResult findShortestPath(Map<String, List<Edge>> graph, String start, String end) {
        if (!graph.containsKey(start)) {
            return new PathResult(Collections.emptyList(), Double.MAX_VALUE, 0);
        }

        Map<String, Double> gScores = new HashMap<>();
        Map<String, Double> fScores = new HashMap<>();
        Map<String, String> predecessors = new HashMap<>();
        
        // PriorityQueue ordered by f(n) = g(n) + h(n)
        PriorityQueue<NodeFDistance> pq = new PriorityQueue<>(Comparator.comparingDouble(nd -> nd.fScore));

        for (String node : graph.keySet()) {
            gScores.put(node, Double.MAX_VALUE);
            fScores.put(node, Double.MAX_VALUE);
        }

        gScores.put(start, 0.0);
        double hStart = getHeuristic(start, end);
        fScores.put(start, hStart);
        pq.add(new NodeFDistance(start, hStart));

        int nodesVisited = 0;

        while (!pq.isEmpty()) {
            NodeFDistance current = pq.poll();
            String u = current.node;
            nodesVisited++;

            if (u.equals(end)) {
                break;
            }

            if (current.fScore > fScores.getOrDefault(u, Double.MAX_VALUE)) {
                continue;
            }

            List<Edge> neighbors = graph.getOrDefault(u, Collections.emptyList());
            for (Edge edge : neighbors) {
                String v = edge.target;
                double weight = edge.weight;
                double tentativeGScore = gScores.get(u) + weight;

                if (tentativeGScore < gScores.getOrDefault(v, Double.MAX_VALUE)) {
                    predecessors.put(v, u);
                    gScores.put(v, tentativeGScore);
                    double fScore = tentativeGScore + getHeuristic(v, end);
                    fScores.put(v, fScore);
                    pq.add(new NodeFDistance(v, fScore));
                }
            }
        }

        if (gScores.get(end) == null || gScores.get(end) == Double.MAX_VALUE) {
            return new PathResult(Collections.emptyList(), Double.MAX_VALUE, nodesVisited);
        }

        List<String> path = new LinkedList<>();
        String step = end;
        while (step != null) {
            path.add(0, step);
            step = predecessors.get(step);
        }

        return new PathResult(path, gScores.get(end), nodesVisited);
    }

    private static class NodeFDistance {
        String node;
        double fScore;

        NodeFDistance(String node, double fScore) {
            this.node = node;
            this.fScore = fScore;
        }
    }
}
