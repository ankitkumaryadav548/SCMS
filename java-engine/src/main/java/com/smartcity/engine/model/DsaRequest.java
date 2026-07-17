package com.smartcity.engine.model;

import java.util.List;

public class DsaRequest {

    public static class GraphInput {
        private List<String> nodes;
        private List<EdgeInput> edges;
        private String startNode;
        private String endNode;
        private boolean directed;

        public GraphInput() {}
        public GraphInput(List<String> nodes, List<EdgeInput> edges, String startNode, String endNode, boolean directed) {
            this.nodes = nodes;
            this.edges = edges;
            this.startNode = startNode;
            this.endNode = endNode;
            this.directed = directed;
        }

        public List<String> getNodes() { return nodes; }
        public void setNodes(List<String> nodes) { this.nodes = nodes; }

        public List<EdgeInput> getEdges() { return edges; }
        public void setEdges(List<EdgeInput> edges) { this.edges = edges; }

        public String getStartNode() { return startNode; }
        public void setStartNode(String startNode) { this.startNode = startNode; }

        public String getEndNode() { return endNode; }
        public void setEndNode(String endNode) { this.endNode = endNode; }

        public boolean isDirected() { return directed; }
        public void setDirected(boolean directed) { this.directed = directed; }
    }

    public static class EdgeInput {
        private String source;
        private String target;
        private double weight;

        public EdgeInput() {}
        public EdgeInput(String source, String target, double weight) {
            this.source = source;
            this.target = target;
            this.weight = weight;
        }

        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }

        public String getTarget() { return target; }
        public void setTarget(String target) { this.target = target; }

        public double getWeight() { return weight; }
        public void setWeight(double weight) { this.weight = weight; }
    }

    public static class SortingInput {
        private int[] array;

        public SortingInput() {}
        public SortingInput(int[] array) { this.array = array; }

        public int[] getArray() { return array; }
        public void setArray(int[] array) { this.array = array; }
    }

    public static class SearchingInput {
        private int[] array;
        private int target;

        public SearchingInput() {}
        public SearchingInput(int[] array, int target) {
            this.array = array;
            this.target = target;
        }

        public int[] getArray() { return array; }
        public void setArray(int[] array) { this.array = array; }

        public int getTarget() { return target; }
        public void setTarget(int target) { this.target = target; }
    }

    public static class TrieInput {
        private String word;
        private String prefix;

        public TrieInput() {}
        public TrieInput(String word, String prefix) {
            this.word = word;
            this.prefix = prefix;
        }

        public String getWord() { return word; }
        public void setWord(String word) { this.word = word; }

        public String getPrefix() { return prefix; }
        public void setPrefix(String prefix) { this.prefix = prefix; }
    }

    public static class DpInput {
        private int[] weights;
        private int[] values;
        private int capacity;

        public DpInput() {}
        public DpInput(int[] weights, int[] values, int capacity) {
            this.weights = weights;
            this.values = values;
            this.capacity = capacity;
        }

        public int[] getWeights() { return weights; }
        public void setWeights(int[] weights) { this.weights = weights; }

        public int[] getValues() { return values; }
        public void setValues(int[] values) { this.values = values; }

        public int getCapacity() { return capacity; }
        public void setCapacity(int capacity) { this.capacity = capacity; }
    }

    public static class GreedyInput {
        private int[] startTimes;
        private int[] endTimes;

        public GreedyInput() {}
        public GreedyInput(int[] startTimes, int[] endTimes) {
            this.startTimes = startTimes;
            this.endTimes = endTimes;
        }

        public int[] getStartTimes() { return startTimes; }
        public void setStartTimes(int[] startTimes) { this.startTimes = startTimes; }

        public int[] getEndTimes() { return endTimes; }
        public void setEndTimes(int[] endTimes) { this.endTimes = endTimes; }
    }
}
