package com.smartcity.engine.controller;

import com.smartcity.engine.model.MstRequest;
import com.smartcity.engine.model.MstResponse;
import com.smartcity.engine.model.PathRequest;
import com.smartcity.engine.model.PathResponse;
import com.smartcity.engine.service.AlgorithmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/algorithms")
public class AlgorithmController {

    private final AlgorithmService algorithmService;

    @Autowired
    public AlgorithmController(AlgorithmService algorithmService) {
        this.algorithmService = algorithmService;
    }

    @PostMapping("/shortest-path")
    public ResponseEntity<PathResponse> calculateShortestPath(@RequestBody PathRequest request) {
        if (request.getStartNode() == null || request.getEndNode() == null) {
            return ResponseEntity.badRequest().build();
        }
        PathResponse response = algorithmService.getShortestPath(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mst")
    public ResponseEntity<MstResponse> calculateMST(@RequestBody MstRequest request) {
        MstResponse response = algorithmService.getMinimumSpanningTree(request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> checkHealth() {
        return ResponseEntity.ok("Java Algorithm Engine is UP and running.");
    }
}
