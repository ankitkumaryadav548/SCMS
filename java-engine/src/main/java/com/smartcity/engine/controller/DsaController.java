package com.smartcity.engine.controller;

import com.smartcity.engine.algorithms.*;
import com.smartcity.engine.model.DsaRequest;
import com.smartcity.engine.model.DsaResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/dsa")
@CrossOrigin(origins = "*")
@Tag(name = "DSA Algorithm Engine", description = "REST APIs exposing custom data structures and algorithm paradigms with complexity telemetry")
public class DsaController {

    private DsaResponse createResponse(Object result, long startTimeNano, String timeComp, String spaceComp) {
        long endTimeNano = System.nanoTime();
        double durationMs = (endTimeNano - startTimeNano) / 1_000_000.0;
        String execTime = String.format("%.4f ms", durationMs);
        return new DsaResponse(result, execTime, timeComp, spaceComp);
    }

    private Map<String, List<GraphAlgorithms.Edge>> buildAdjList(DsaRequest.GraphInput input) {
        Map<String, List<GraphAlgorithms.Edge>> adjList = new HashMap<>();
        for (String node : input.getNodes()) {
            adjList.put(node, new ArrayList<>());
        }
        for (DsaRequest.EdgeInput e : input.getEdges()) {
            adjList.computeIfAbsent(e.getSource(), k -> new ArrayList<>())
                   .add(new GraphAlgorithms.Edge(e.getSource(), e.getTarget(), e.getWeight()));
            if (!input.isDirected()) {
                adjList.computeIfAbsent(e.getTarget(), k -> new ArrayList<>())
                       .add(new GraphAlgorithms.Edge(e.getTarget(), e.getSource(), e.getWeight()));
            }
        }
        return adjList;
    }

    // --- Graph Algorithms ---

    @PostMapping("/graph/bfs")
    @Operation(summary = "Breadth First Search (BFS)", description = "Performs BFS traversal starting from a node")
    public DsaResponse runBfs(@RequestBody DsaRequest.GraphInput input) {
        long start = System.nanoTime();
        Map<String, List<GraphAlgorithms.Edge>> adjList = buildAdjList(input);
        GraphAlgorithms.BfsDfsResult res = GraphAlgorithms.runBfs(adjList, input.getStartNode());
        return createResponse(res.traversal, start, "O(V + E)", "O(V)");
    }

    @PostMapping("/graph/dfs")
    @Operation(summary = "Depth First Search (DFS)", description = "Performs DFS traversal starting from a node")
    public DsaResponse runDfs(@RequestBody DsaRequest.GraphInput input) {
        long start = System.nanoTime();
        Map<String, List<GraphAlgorithms.Edge>> adjList = buildAdjList(input);
        GraphAlgorithms.BfsDfsResult res = GraphAlgorithms.runDfs(adjList, input.getStartNode());
        return createResponse(res.traversal, start, "O(V + E)", "O(V)");
    }

    @PostMapping("/graph/dijkstra")
    @Operation(summary = "Dijkstra Shortest Path", description = "Finds shortest path between start and end node using Dijkstra")
    public DsaResponse runDijkstra(@RequestBody DsaRequest.GraphInput input) {
        long start = System.nanoTime();
        Map<String, List<GraphAlgorithms.Edge>> adjList = buildAdjList(input);
        GraphAlgorithms.PathResult res = GraphAlgorithms.runDijkstra(adjList, input.getStartNode(), input.getEndNode());
        return createResponse(res, start, "O((V + E) log V)", "O(V)");
    }

    @PostMapping("/graph/astar")
    @Operation(summary = "A* (A-Star) Pathfinding", description = "Finds shortest path using A* search with simulated coordinates")
    public DsaResponse runAStar(@RequestBody DsaRequest.GraphInput input) {
        long start = System.nanoTime();
        Map<String, List<GraphAlgorithms.Edge>> adjList = buildAdjList(input);
        Map<String, double[]> coordinates = new HashMap<>();
        int index = 0;
        for (String node : input.getNodes()) {
            coordinates.put(node, new double[]{index * 1.5, index * 2.0});
            index++;
        }
        GraphAlgorithms.PathResult res = GraphAlgorithms.runAStar(adjList, coordinates, input.getStartNode(), input.getEndNode());
        return createResponse(res, start, "O((V + E) log V)", "O(V)");
    }

    @PostMapping("/graph/bellmanford")
    @Operation(summary = "Bellman-Ford Shortest Path", description = "Computes shortest path; detects negative-weight cycles")
    public DsaResponse runBellmanFord(@RequestBody DsaRequest.GraphInput input) {
        long start = System.nanoTime();
        List<GraphAlgorithms.Edge> edges = new ArrayList<>();
        for (DsaRequest.EdgeInput e : input.getEdges()) {
            edges.add(new GraphAlgorithms.Edge(e.getSource(), e.getTarget(), e.getWeight()));
            if (!input.isDirected()) {
                edges.add(new GraphAlgorithms.Edge(e.getTarget(), e.getSource(), e.getWeight()));
            }
        }
        GraphAlgorithms.PathResult res = GraphAlgorithms.runBellmanFord(input.getNodes(), edges, input.getStartNode(), input.getEndNode());
        return createResponse(res, start, "O(V * E)", "O(V)");
    }

    @PostMapping("/graph/floydwarshall")
    @Operation(summary = "Floyd-Warshall All-Pairs Shortest Path", description = "Computes shortest path distances between all pairs of nodes")
    public DsaResponse runFloydWarshall(@RequestBody DsaRequest.GraphInput input) {
        long start = System.nanoTime();
        List<GraphAlgorithms.Edge> edges = new ArrayList<>();
        for (DsaRequest.EdgeInput e : input.getEdges()) {
            edges.add(new GraphAlgorithms.Edge(e.getSource(), e.getTarget(), e.getWeight()));
            if (!input.isDirected()) {
                edges.add(new GraphAlgorithms.Edge(e.getTarget(), e.getSource(), e.getWeight()));
            }
        }
        GraphAlgorithms.FloydWarshallResult res = GraphAlgorithms.runFloydWarshall(input.getNodes(), edges);
        return createResponse(res.distances, start, "O(V^3)", "O(V^2)");
    }

    @PostMapping("/graph/prim")
    @Operation(summary = "Prim Minimum Spanning Tree (MST)", description = "Computes Minimum Spanning Tree using Prim's algorithm")
    public DsaResponse runPrim(@RequestBody DsaRequest.GraphInput input) {
        long start = System.nanoTime();
        Map<String, List<GraphAlgorithms.Edge>> adjList = buildAdjList(input);
        GraphAlgorithms.MstResult res = GraphAlgorithms.runPrim(input.getNodes(), adjList);
        return createResponse(res, start, "O(E log V)", "O(V + E)");
    }

    @PostMapping("/graph/kruskal")
    @Operation(summary = "Kruskal Minimum Spanning Tree (MST)", description = "Computes Minimum Spanning Tree using Kruskal's algorithm")
    public DsaResponse runKruskal(@RequestBody DsaRequest.GraphInput input) {
        long start = System.nanoTime();
        List<GraphAlgorithms.Edge> edges = new ArrayList<>();
        for (DsaRequest.EdgeInput e : input.getEdges()) {
            edges.add(new GraphAlgorithms.Edge(e.getSource(), e.getTarget(), e.getWeight()));
        }
        GraphAlgorithms.MstResult res = GraphAlgorithms.runKruskal(input.getNodes(), edges);
        return createResponse(res, start, "O(E log E)", "O(V + E)");
    }

    // --- Dynamic Programming & Greedy ---

    @PostMapping("/dp/knapsack")
    @Operation(summary = "0/1 Knapsack Solver", description = "Solves Knapsack optimization using Dynamic Programming")
    public DsaResponse runKnapsack(@RequestBody DsaRequest.DpInput input) {
        long start = System.nanoTime();
        DpGreedyAlgorithms.KnapsackResult res = DpGreedyAlgorithms.solveKnapsack(input.getWeights(), input.getValues(), input.getCapacity());
        return createResponse(res, start, "O(N * W)", "O(N * W)");
    }

    @PostMapping("/greedy/activity-selection")
    @Operation(summary = "Activity Selection", description = "Solves maximum compatibility interval selection using Greedy choice")
    public DsaResponse runActivitySelection(@RequestBody DsaRequest.GreedyInput input) {
        long start = System.nanoTime();
        List<Integer> res = DpGreedyAlgorithms.selectActivities(input.getStartTimes(), input.getEndTimes());
        return createResponse(res, start, "O(N log N)", "O(N)");
    }

    // --- Sorting & Searching ---

    @PostMapping("/sort/bubble")
    @Operation(summary = "Bubble Sort", description = "Sorts an array using Bubble Sort")
    public DsaResponse runBubbleSort(@RequestBody DsaRequest.SortingInput input) {
        long start = System.nanoTime();
        int[] res = SortingSearching.bubbleSort(input.getArray());
        return createResponse(res, start, "O(N^2)", "O(1)");
    }

    @PostMapping("/sort/quick")
    @Operation(summary = "Quick Sort", description = "Sorts an array using Quick Sort")
    public DsaResponse runQuickSort(@RequestBody DsaRequest.SortingInput input) {
        long start = System.nanoTime();
        int[] res = SortingSearching.quickSort(input.getArray());
        return createResponse(res, start, "O(N log N) avg, O(N^2) worst", "O(log N) stack");
    }

    @PostMapping("/sort/merge")
    @Operation(summary = "Merge Sort", description = "Sorts an array using Merge Sort")
    public DsaResponse runMergeSort(@RequestBody DsaRequest.SortingInput input) {
        long start = System.nanoTime();
        int[] res = SortingSearching.mergeSort(input.getArray());
        return createResponse(res, start, "O(N log N)", "O(N)");
    }

    @PostMapping("/sort/heap")
    @Operation(summary = "Heap Sort", description = "Sorts an array using Heap Sort")
    public DsaResponse runHeapSort(@RequestBody DsaRequest.SortingInput input) {
        long start = System.nanoTime();
        int[] res = SortingSearching.heapSort(input.getArray());
        return createResponse(res, start, "O(N log N)", "O(1)");
    }

    @PostMapping("/search/linear")
    @Operation(summary = "Linear Search", description = "Searches for a target using linear scans")
    public DsaResponse runLinearSearch(@RequestBody DsaRequest.SearchingInput input) {
        long start = System.nanoTime();
        int index = SortingSearching.linearSearch(input.getArray(), input.getTarget());
        return createResponse(index, start, "O(N)", "O(1)");
    }

    @PostMapping("/search/binary")
    @Operation(summary = "Binary Search", description = "Searches for a target in a sorted array using Binary Search")
    public DsaResponse runBinarySearch(@RequestBody DsaRequest.SearchingInput input) {
        long start = System.nanoTime();
        int[] sorted = input.getArray().clone();
        Arrays.sort(sorted);
        int index = SortingSearching.binarySearch(sorted, input.getTarget());
        Map<String, Object> result = new HashMap<>();
        result.put("sortedArray", sorted);
        result.put("foundIndexInSorted", index);
        return createResponse(result, start, "O(log N)", "O(1)");
    }

    // --- Custom Data Structures ---

    @PostMapping("/datastructures/trie")
    @Operation(summary = "Trie Operations (Insert/Search/Prefix)", description = "Demonstrates insertion and queries in a Prefix Tree")
    public DsaResponse runTrie(@RequestBody List<DsaRequest.TrieInput> inputs) {
        long start = System.nanoTime();
        CustomDataStructures.Trie trie = new CustomDataStructures.Trie();
        List<Map<String, Object>> results = new ArrayList<>();
        for (DsaRequest.TrieInput input : inputs) {
            Map<String, Object> step = new HashMap<>();
            if (input.getWord() != null) {
                trie.insert(input.getWord());
                step.put("action", "insert: " + input.getWord());
            }
            if (input.getPrefix() != null) {
                boolean startsWith = trie.startsWith(input.getPrefix());
                step.put("action", "startsWith: " + input.getPrefix());
                step.put("result", startsWith);
            }
            if (input.getWord() != null) {
                boolean search = trie.search(input.getWord());
                step.put("action", "search: " + input.getWord());
                step.put("result", search);
            }
            results.add(step);
        }
        return createResponse(results, start, "O(L) per word op", "O(ALPHABET_SIZE * L * N)");
    }

    @PostMapping("/datastructures/linkedlist")
    @Operation(summary = "Linked List Simulator", description = "Demonstrates Singly Linked List insertions and deletions")
    public DsaResponse runLinkedList(@RequestBody List<String> operations) {
        long start = System.nanoTime();
        CustomDataStructures.SinglyLinkedList<String> list = new CustomDataStructures.SinglyLinkedList<>();
        for (String op : operations) {
            if (op.startsWith("insert:")) {
                list.insert(op.substring(7));
            } else if (op.startsWith("delete:")) {
                list.delete(op.substring(7));
            }
        }
        return createResponse(list.toList(), start, "O(N) search/delete, O(1) insert at tail", "O(N)");
    }

    @PostMapping("/datastructures/stack")
    @Operation(summary = "Stack Simulator", description = "Pushes and pops operations on a Stack")
    public DsaResponse runStack(@RequestBody List<String> operations) {
        long start = System.nanoTime();
        CustomDataStructures.Stack<String> stack = new CustomDataStructures.Stack<>();
        List<String> logs = new ArrayList<>();
        for (String op : operations) {
            if (op.startsWith("push:")) {
                stack.push(op.substring(5));
                logs.add("Pushed: " + op.substring(5));
            } else if (op.equals("pop")) {
                if (!stack.isEmpty()) {
                    logs.add("Popped: " + stack.pop());
                } else {
                    logs.add("Pop failed: Stack Empty");
                }
            }
        }
        Map<String, Object> res = new HashMap<>();
        res.put("finalStackContent", stack.toList());
        res.put("operationLogs", logs);
        return createResponse(res, start, "O(1) push/pop", "O(N)");
    }

    @PostMapping("/datastructures/queue")
    @Operation(summary = "Queue Simulator", description = "Enqueues and dequeues operations on a Queue")
    public DsaResponse runQueue(@RequestBody List<String> operations) {
        long start = System.nanoTime();
        CustomDataStructures.Queue<String> queue = new CustomDataStructures.Queue<>();
        List<String> logs = new ArrayList<>();
        for (String op : operations) {
            if (op.startsWith("enqueue:")) {
                queue.enqueue(op.substring(8));
                logs.add("Enqueued: " + op.substring(8));
            } else if (op.equals("dequeue")) {
                if (!queue.isEmpty()) {
                    logs.add("Dequeued: " + queue.dequeue());
                } else {
                    logs.add("Dequeue failed: Queue Empty");
                }
            }
        }
        Map<String, Object> res = new HashMap<>();
        res.put("finalQueueContent", queue.toList());
        res.put("operationLogs", logs);
        return createResponse(res, start, "O(1) enqueue/dequeue", "O(N)");
    }

    @PostMapping("/datastructures/priorityqueue")
    @Operation(summary = "Priority Queue Min-Heap Simulator", description = "Insert numbers and extract minimum values using Min-Heap priority queue")
    public DsaResponse runPriorityQueue(@RequestBody List<String> operations) {
        long start = System.nanoTime();
        CustomDataStructures.CustomPriorityQueue pq = new CustomDataStructures.CustomPriorityQueue();
        List<String> logs = new ArrayList<>();
        for (String op : operations) {
            if (op.startsWith("insert:")) {
                double val = Double.parseDouble(op.substring(7));
                pq.insert(val);
                logs.add("Inserted: " + val);
            } else if (op.equals("extractMin")) {
                if (!pq.isEmpty()) {
                    logs.add("Extracted Min: " + pq.extractMin());
                } else {
                    logs.add("Extraction failed: PQ Empty");
                }
            }
        }
        Map<String, Object> res = new HashMap<>();
        res.put("finalHeapState", pq.toList());
        res.put("operationLogs", logs);
        return createResponse(res, start, "O(log N) insert/extract, O(1) peek", "O(N)");
    }

    @PostMapping("/datastructures/hashmap")
    @Operation(summary = "Custom Hash Map Chaining Simulator", description = "Inserts, deletes, and retrieves key-value entries in a chaining hash table")
    public DsaResponse runHashMap(@RequestBody List<String> operations) {
        long start = System.nanoTime();
        CustomDataStructures.CustomHashMap<String, String> map = new CustomDataStructures.CustomHashMap<>();
        List<String> logs = new ArrayList<>();
        for (String op : operations) {
            if (op.startsWith("put:")) {
                String[] parts = op.substring(4).split("=");
                map.put(parts[0], parts[1]);
                logs.add("Put: " + parts[0] + " -> " + parts[1]);
            } else if (op.startsWith("get:")) {
                String key = op.substring(4);
                logs.add("Get: " + key + " -> " + map.get(key));
            } else if (op.startsWith("remove:")) {
                String key = op.substring(7);
                logs.add("Removed: " + key + " -> " + map.remove(key));
            }
        }
        Map<String, Object> res = new HashMap<>();
        res.put("finalMapEntries", map.entryList());
        res.put("operationLogs", logs);
        return createResponse(res, start, "O(1) average put/get/remove", "O(N)");
    }

    @PostMapping("/datastructures/unionfind")
    @Operation(summary = "Union Find (DSU) Simulator", description = "Unions sets and checks connected components using Disjoint Set Union")
    public DsaResponse runUnionFind(@RequestParam int size, @RequestBody List<String> operations) {
        long start = System.nanoTime();
        CustomDataStructures.UnionFind dsu = new CustomDataStructures.UnionFind(size);
        List<String> logs = new ArrayList<>();
        for (String op : operations) {
            if (op.startsWith("union:")) {
                String[] parts = op.substring(6).split(",");
                int u = Integer.parseInt(parts[0]);
                int v = Integer.parseInt(parts[1]);
                boolean unioned = dsu.union(u, v);
                logs.add("Union (" + u + ", " + v + ") -> " + (unioned ? "Merged" : "Already Connected"));
            } else if (op.startsWith("find:")) {
                int node = Integer.parseInt(op.substring(5));
                logs.add("Find (" + node + ") -> Root: " + dsu.find(node));
            }
        }
        return createResponse(logs, start, "O(alpha(N)) single operation", "O(N)");
    }
}
