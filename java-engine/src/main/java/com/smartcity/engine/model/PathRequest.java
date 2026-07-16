package com.smartcity.engine.model;

import java.util.List;

public class PathRequest {
    private String startNode;
    private String endNode;
    private List<EdgeInput> customEdges;

    public String getStartNode() {
        return startNode;
    }

    public void setStartNode(String startNode) {
        this.startNode = startNode;
    }

    public String getEndNode() {
        return endNode;
    }

    public void setEndNode(String endNode) {
        this.endNode = endNode;
    }

    public List<EdgeInput> getCustomEdges() {
        return customEdges;
    }

    public void setCustomEdges(List<EdgeInput> customEdges) {
        this.customEdges = customEdges;
    }

    public static class EdgeInput {
        private String source;
        private String target;
        private double weight;

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }

        public String getTarget() {
            return target;
        }

        public void setTarget(String target) {
            this.target = target;
        }

        public double getWeight() {
            return weight;
        }

        public void setWeight(double weight) {
            this.weight = weight;
        }
    }
}
