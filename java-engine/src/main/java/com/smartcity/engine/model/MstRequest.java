package com.smartcity.engine.model;

import lombok.Data;
import java.util.List;

@Data
public class MstRequest {
    private List<String> nodeIds;
    private List<EdgeInput> customEdges;

    @Data
    public static class EdgeInput {
        private String source;
        private String target;
        private double weight;
    }
}
