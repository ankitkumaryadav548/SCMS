package com.smartcity.engine.model;

import java.util.List;

public class PathResponse {
    private List<String> path;
    private double totalCost;
    private String executionTime;

    public PathResponse() {}

    public PathResponse(List<String> path, double totalCost, String executionTime) {
        this.path = path;
        this.totalCost = totalCost;
        this.executionTime = executionTime;
    }

    public List<String> getPath() {
        return path;
    }

    public void setPath(List<String> path) {
        this.path = path;
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
}
