package com.smartcity.engine.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PathResponse {
    private List<String> path;
    private double totalCost;
    private String executionTime;
}
