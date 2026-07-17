package com.smartcity.engine.algorithms;

import java.util.*;

public class GraphAlgorithms {

    // Helper classes
    public static class Edge {
        public String source;
        public String target;
        public double weight;
        public Edge() {}
        public Edge(String source, String target, double weight) {
            this.source = source;
            this.target = target;
            this.weight = weight;
        }
    }

    public static class PathResult {
        public List<String> path;
        public double totalCost;
        public String message;
        public PathResult(List<String> path, double totalCost) {
            this.path = path;
            this.totalCost = totalCost;
        }
        public PathResult(List<String> path, double totalCost, String message) {
            this.path = path;
            this.totalCost = totalCost;
            this.message = message;
        }
    }

    // 1. BFS & DFS
    public static class BfsDfsResult {
        public List<String> traversal;
        public BfsDfsResult(List<String> traversal) { this.traversal = traversal; }
    }

    public static BfsDfsResult runBfs(Map<String, List<Edge>> adjList, String startNode) {
        List<String> traversal = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();

        if (adjList.containsKey(startNode)) {
            queue.offer(startNode);
            visited.add(startNode);
        }

        while (!queue.isEmpty()) {
            String curr = queue.poll();
            traversal.add(curr);
            List<Edge> neighbors = adjList.getOrDefault(curr, Collections.emptyList());
            for (Edge edge : neighbors) {
                if (!visited.contains(edge.target)) {
                    visited.add(edge.target);
                    queue.offer(edge.target);
                }
            }
        }
        return new BfsDfsResult(traversal);
    }

    public static BfsDfsResult runDfs(Map<String, List<Edge>> adjList, String startNode) {
        List<String> traversal = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        dfsHelper(adjList, startNode, visited, traversal);
        return new BfsDfsResult(traversal);
    }

    private static void dfsHelper(Map<String, List<Edge>> adjList, String node, Set<String> visited, List<String> traversal) {
        if (visited.contains(node)) return;
        visited.add(node);
        traversal.add(node);
        List<Edge> neighbors = adjList.getOrDefault(node, Collections.emptyList());
        for (Edge edge : neighbors) {
            dfsHelper(adjList, edge.target, visited, traversal);
        }
    }

    // 2. Dijkstra
    public static PathResult runDijkstra(Map<String, List<Edge>> adjList, String start, String end) {
        Map<String, Double> distances = new HashMap<>();
        Map<String, String> parent = new HashMap<>();
        PriorityQueue<Map.Entry<String, Double>> pq = new PriorityQueue<>(Map.Entry.comparingByValue());

        distances.put(start, 0.0);
        pq.offer(new AbstractMap.SimpleEntry<>(start, 0.0));

        while (!pq.isEmpty()) {
            Map.Entry<String, Double> entry = pq.poll();
            String curr = entry.getKey();
            double d = entry.getValue();

            if (d > distances.getOrDefault(curr, Double.MAX_VALUE)) continue;
            if (curr.equals(end)) break;

            for (Edge edge : adjList.getOrDefault(curr, Collections.emptyList())) {
                double newDist = d + edge.weight;
                if (newDist < distances.getOrDefault(edge.target, Double.MAX_VALUE)) {
                    distances.put(edge.target, newDist);
                    parent.put(edge.target, curr);
                    pq.offer(new AbstractMap.SimpleEntry<>(edge.target, newDist));
                }
            }
        }

        if (!distances.containsKey(end)) {
            return new PathResult(Collections.emptyList(), -1.0, "Path not found");
        }

        List<String> path = new ArrayList<>();
        String curr = end;
        while (curr != null) {
            path.add(0, curr);
            curr = parent.get(curr);
        }
        return new PathResult(path, distances.get(end));
    }

    // 3. A* (A-Star) Pathfinding
    public static PathResult runAStar(Map<String, List<Edge>> adjList, Map<String, double[]> coordinates, String start, String end) {
        Map<String, Double> gScore = new HashMap<>();
        Map<String, Double> fScore = new HashMap<>();
        Map<String, String> parent = new HashMap<>();
        
        PriorityQueue<Map.Entry<String, Double>> openSet = new PriorityQueue<>(Map.Entry.comparingByValue());

        gScore.put(start, 0.0);
        double startHeuristic = heuristic(start, end, coordinates);
        fScore.put(start, startHeuristic);
        openSet.offer(new AbstractMap.SimpleEntry<>(start, startHeuristic));

        while (!openSet.isEmpty()) {
            String curr = openSet.poll().getKey();
            if (curr.equals(end)) break;

            for (Edge edge : adjList.getOrDefault(curr, Collections.emptyList())) {
                double tentativeGScore = gScore.getOrDefault(curr, Double.MAX_VALUE) + edge.weight;
                if (tentativeGScore < gScore.getOrDefault(edge.target, Double.MAX_VALUE)) {
                    parent.put(edge.target, curr);
                    gScore.put(edge.target, tentativeGScore);
                    double scoreF = tentativeGScore + heuristic(edge.target, end, coordinates);
                    fScore.put(edge.target, scoreF);
                    openSet.offer(new AbstractMap.SimpleEntry<>(edge.target, scoreF));
                }
            }
        }

        if (!gScore.containsKey(end)) {
            return new PathResult(Collections.emptyList(), -1.0, "Path not found");
        }

        List<String> path = new ArrayList<>();
        String curr = end;
        while (curr != null) {
            path.add(0, curr);
            curr = parent.get(curr);
        }
        return new PathResult(path, gScore.get(end));
    }

    private static double heuristic(String u, String v, Map<String, double[]> coordinates) {
        if (coordinates == null || !coordinates.containsKey(u) || !coordinates.containsKey(v)) return 0.0;
        double[] coordsU = coordinates.get(u);
        double[] coordsV = coordinates.get(v);
        // Euclidean distance
        return Math.sqrt(Math.pow(coordsU[0] - coordsV[0], 2) + Math.pow(coordsU[1] - coordsV[1], 2));
    }

    // 4. Bellman-Ford
    public static PathResult runBellmanFord(List<String> nodes, List<Edge> edges, String start, String end) {
        Map<String, Double> distances = new HashMap<>();
        Map<String, String> parent = new HashMap<>();

        for (String node : nodes) {
            distances.put(node, Double.MAX_VALUE);
        }
        distances.put(start, 0.0);

        int n = nodes.size();
        for (int i = 0; i < n - 1; i++) {
            for (Edge edge : edges) {
                if (distances.get(edge.source) != Double.MAX_VALUE) {
                    double newDist = distances.get(edge.source) + edge.weight;
                    if (newDist < distances.get(edge.target)) {
                        distances.put(edge.target, newDist);
                        parent.put(edge.target, edge.source);
                    }
                }
            }
        }

        // Negative cycle detection
        for (Edge edge : edges) {
            if (distances.get(edge.source) != Double.MAX_VALUE) {
                if (distances.get(edge.source) + edge.weight < distances.get(edge.target)) {
                    return new PathResult(Collections.emptyList(), -1.0, "Graph contains a negative-weight cycle!");
                }
            }
        }

        if (distances.get(end) == Double.MAX_VALUE) {
            return new PathResult(Collections.emptyList(), -1.0, "Path not found");
        }

        List<String> path = new ArrayList<>();
        String curr = end;
        while (curr != null) {
            path.add(0, curr);
            curr = parent.get(curr);
        }
        return new PathResult(path, distances.get(end));
    }

    // 5. Floyd-Warshall
    public static class FloydWarshallResult {
        public Map<String, Map<String, Double>> distances;
        public FloydWarshallResult(Map<String, Map<String, Double>> distances) {
            this.distances = distances;
        }
    }

    public static FloydWarshallResult runFloydWarshall(List<String> nodes, List<Edge> edges) {
        Map<String, Map<String, Double>> dist = new HashMap<>();

        for (String u : nodes) {
            dist.put(u, new HashMap<>());
            for (String v : nodes) {
                if (u.equals(v)) dist.get(u).put(v, 0.0);
                else dist.get(u).put(v, Double.MAX_VALUE);
            }
        }

        for (Edge edge : edges) {
            dist.get(edge.source).put(edge.target, Math.min(dist.get(edge.source).get(edge.target), edge.weight));
        }

        for (String k : nodes) {
            for (String i : nodes) {
                for (String j : nodes) {
                    double ik = dist.get(i).get(k);
                    double kj = dist.get(k).get(j);
                    if (ik != Double.MAX_VALUE && kj != Double.MAX_VALUE) {
                        double ij = dist.get(i).get(j);
                        if (ik + kj < ij) {
                            dist.get(i).put(j, ik + kj);
                        }
                    }
                }
            }
        }
        return new FloydWarshallResult(dist);
    }

    // 6. Prim
    public static class MstResult {
        public List<Edge> mstEdges;
        public double totalWeight;
        public MstResult(List<Edge> mstEdges, double totalWeight) {
            this.mstEdges = mstEdges;
            this.totalWeight = totalWeight;
        }
    }

    public static MstResult runPrim(List<String> nodes, Map<String, List<Edge>> adjList) {
        if (nodes.isEmpty()) return new MstResult(Collections.emptyList(), 0.0);

        List<Edge> mst = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        PriorityQueue<Edge> pq = new PriorityQueue<>(Comparator.comparingDouble(e -> e.weight));

        String start = nodes.get(0);
        visited.add(start);
        for (Edge e : adjList.getOrDefault(start, Collections.emptyList())) {
            pq.offer(e);
        }

        double totalWeight = 0;
        while (!pq.isEmpty() && visited.size() < nodes.size()) {
            Edge edge = pq.poll();
            if (visited.contains(edge.source) && visited.contains(edge.target)) continue;

            String unvisited = visited.contains(edge.source) ? edge.target : edge.source;
            mst.add(edge);
            totalWeight += edge.weight;
            visited.add(unvisited);

            for (Edge e : adjList.getOrDefault(unvisited, Collections.emptyList())) {
                if (!visited.contains(e.target)) {
                    pq.offer(e);
                }
            }
        }
        return new MstResult(mst, totalWeight);
    }

    // 7. Kruskal
    public static MstResult runKruskal(List<String> nodes, List<Edge> edges) {
        List<Edge> mst = new ArrayList<>();
        double totalWeight = 0;

        Map<String, String> parent = new HashMap<>();
        for (String node : nodes) {
            parent.put(node, node);
        }

        List<Edge> sortedEdges = new ArrayList<>(edges);
        sortedEdges.sort(Comparator.comparingDouble(e -> e.weight));

        for (Edge edge : sortedEdges) {
            String rootSrc = findRoot(edge.source, parent);
            String rootTgt = findRoot(edge.target, parent);

            if (!rootSrc.equals(rootTgt)) {
                mst.add(edge);
                totalWeight += edge.weight;
                parent.put(rootSrc, rootTgt); // Union
            }
        }
        return new MstResult(mst, totalWeight);
    }

    private static String findRoot(String node, Map<String, String> parent) {
        String curr = node;
        while (!parent.get(curr).equals(curr)) {
            curr = parent.get(curr);
        }
        String p = node;
        while (!p.equals(curr)) {
            String next = parent.get(p);
            parent.put(p, curr);
            p = next;
        }
        return curr;
    }
}
