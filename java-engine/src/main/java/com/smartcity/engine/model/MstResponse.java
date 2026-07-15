package com.smartcity.engine.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MstResponse {
    private List<EdgeOutput> mstEdges;
    private double totalCost;
    private String executionTime;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EdgeOutput {
        private String source;
        private String target;
        private double weight;
    }
}
