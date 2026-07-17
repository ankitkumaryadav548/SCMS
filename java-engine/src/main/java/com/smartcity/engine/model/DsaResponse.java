package com.smartcity.engine.model;

public class DsaResponse {
    private Object result;
    private String executionTime;
    private String timeComplexity;
    private String spaceComplexity;

    public DsaResponse() {}
    public DsaResponse(Object result, String executionTime, String timeComplexity, String spaceComplexity) {
        this.result = result;
        this.executionTime = executionTime;
        this.timeComplexity = timeComplexity;
        this.spaceComplexity = spaceComplexity;
    }

    public Object getResult() { return result; }
    public void setResult(Object result) { this.result = result; }

    public String getExecutionTime() { return executionTime; }
    public void setExecutionTime(String executionTime) { this.executionTime = executionTime; }

    public String getTimeComplexity() { return timeComplexity; }
    public void setTimeComplexity(String timeComplexity) { this.timeComplexity = timeComplexity; }

    public String getSpaceComplexity() { return spaceComplexity; }
    public void setSpaceComplexity(String spaceComplexity) { this.spaceComplexity = spaceComplexity; }
}
