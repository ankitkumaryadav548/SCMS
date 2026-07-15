package com.smartcity.engine.algorithms;

import java.util.*;

public class Kruskal {

    public static class Edge implements Comparable<Edge> {
        public String source;
        public String target;
        public double weight;

        public Edge(String source, String target, double weight) {
            this.source = source;
            this.target = target;
            this.weight = weight;
        }

        @Override
        public int compareTo(Edge other) {
            return Double.compare(this.weight, other.weight);
        }
    }

    public static class MstResult {
        public List<Edge> mstEdges;
        public double totalCost;

        public MstResult(List<Edge> mstEdges, double totalCost) {
            this.mstEdges = mstEdges;
            this.totalCost = totalCost;
        }
    }

    public static MstResult computeMST(List<String> nodes, List<Edge> edges) {
        List<Edge> result = new ArrayList<>();
        double totalWeight = 0;

        // Disjoint Set (Union-Find) structure
        Map<String, String> parent = new HashMap<>();
        Map<String, Integer> rank = new HashMap<>();

        for (String node : nodes) {
            parent.put(node, node);
            rank.put(node, 0);
        }

        Collections.sort(edges);

        for (Edge edge : edges) {
            // Check if both nodes exist in our set (if input nodes are filtered)
            if (!parent.containsKey(edge.source) || !parent.containsKey(edge.target)) {
                continue;
            }

            String rootSrc = find(parent, edge.source);
            String rootTgt = find(parent, edge.target);

            if (!rootSrc.equals(rootTgt)) {
                result.add(edge);
                totalWeight += edge.weight;
                union(parent, rank, rootSrc, rootTgt);
            }
        }

        return new MstResult(result, totalWeight);
    }

    private static String find(Map<String, String> parent, String node) {
        if (!parent.get(node).equals(node)) {
            parent.put(node, find(parent, parent.get(node))); // Path compression
        }
        return parent.get(node);
    }

    private static void union(Map<String, String> parent, Map<String, Integer> rank, String root1, String root2) {
        int rank1 = rank.get(root1);
        int rank2 = rank.get(root2);

        if (rank1 < rank2) {
            parent.put(root1, root2);
        } else if (rank1 > rank2) {
            parent.put(root2, root1);
        } else {
            parent.put(root2, root1);
            rank.put(root1, rank1 + 1);
        }
    }
}
