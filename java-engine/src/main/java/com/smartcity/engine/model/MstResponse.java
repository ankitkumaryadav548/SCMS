package com.smartcity.engine.model;

import java.util.List;

public class MstResponse {
    private List<EdgeOutput> mstEdges;
    private double totalCost;
    private String executionTime;

    public MstResponse() {}

    public MstResponse(List<EdgeOutput> mstEdges, double totalCost, String executionTime) {
        this.mstEdges = mstEdges;
        this.totalCost = totalCost;
        this.executionTime = executionTime;
    }

    public List<EdgeOutput> getMstEdges() {
        return mstEdges;
    }

    public void setMstEdges(List<EdgeOutput> mstEdges) {
        this.mstEdges = mstEdges;
    }

    public double getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(double totalCost) {
        this.totalCost = totalCost;
    }

    public String getExecutionTime() {
        return executionTime;
    }

    public void setExecutionTime(String executionTime) {
        this.executionTime = executionTime;
    }

    public static class EdgeOutput {
        private String source;
        private String target;
        private double weight;

        public EdgeOutput() {}

        public EdgeOutput(String source, String target, double weight) {
            this.source = source;
            this.target = target;
            this.weight = weight;
        }

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
