package com.smartcity.engine.model;

import java.util.List;

public class PathResponse {
    private List<String> path;
    private double totalCost;
    private String executionTime;
    private int nodesVisited;
    private java.util.Map<String, Object> comparison;

    public PathResponse() {}

    public PathResponse(List<String> path, double totalCost, String executionTime) {
        this.path = path;
        this.totalCost = totalCost;
        this.executionTime = executionTime;
    }

    public PathResponse(List<String> path, double totalCost, String executionTime, int nodesVisited, java.util.Map<String, Object> comparison) {
        this.path = path;
        this.totalCost = totalCost;
        this.executionTime = executionTime;
        this.nodesVisited = nodesVisited;
        this.comparison = comparison;
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

    public int getNodesVisited() {
        return nodesVisited;
    }

    public void setNodesVisited(int nodesVisited) {
        this.nodesVisited = nodesVisited;
    }

    public java.util.Map<String, Object> getComparison() {
        return comparison;
    }

    public void setComparison(java.util.Map<String, Object> comparison) {
        this.comparison = comparison;
    }
}
