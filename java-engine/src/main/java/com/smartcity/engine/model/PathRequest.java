package com.smartcity.engine.model;

import lombok.Data;
import java.util.List;

@Data
public class PathRequest {
    private String startNode;
    private String endNode;
    private List<EdgeInput> customEdges;

    @Data
    public static class EdgeInput {
        private String source;
        private String target;
        private double weight;
    }
}
