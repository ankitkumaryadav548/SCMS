package com.smartcity.engine.model;

import java.util.List;

public class MstRequest {
    private List<String> nodeIds;
    private List<EdgeInput> customEdges;

    public List<String> getNodeIds() {
        return nodeIds;
    }

    public void setNodeIds(List<String> nodeIds) {
        this.nodeIds = nodeIds;
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
