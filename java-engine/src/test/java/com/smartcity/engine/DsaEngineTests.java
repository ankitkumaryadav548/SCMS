package com.smartcity.engine;

import com.smartcity.engine.algorithms.*;
import org.junit.jupiter.api.Test;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class DsaEngineTests {

    @Test
    public void testCustomDataStructures() {
        // 1. Linked List
        CustomDataStructures.SinglyLinkedList<Integer> list = new CustomDataStructures.SinglyLinkedList<>();
        list.insert(10);
        list.insert(20);
        list.insert(30);
        assertEquals(Arrays.asList(10, 20, 30), list.toList());
        assertTrue(list.delete(20));
        assertEquals(Arrays.asList(10, 30), list.toList());
        assertFalse(list.delete(50));

        // 2. Stack
        CustomDataStructures.Stack<String> stack = new CustomDataStructures.Stack<>();
        assertTrue(stack.isEmpty());
        stack.push("A");
        stack.push("B");
        assertEquals("B", stack.peek());
        assertEquals("B", stack.pop());
        assertEquals("A", stack.pop());
        assertTrue(stack.isEmpty());

        // 3. Queue
        CustomDataStructures.Queue<String> queue = new CustomDataStructures.Queue<>();
        assertTrue(queue.isEmpty());
        queue.enqueue("X");
        queue.enqueue("Y");
        assertEquals("X", queue.peek());
        assertEquals("X", queue.dequeue());
        assertEquals("Y", queue.dequeue());
        assertTrue(queue.isEmpty());

        // 4. Trie
        CustomDataStructures.Trie trie = new CustomDataStructures.Trie();
        trie.insert("smartcity");
        trie.insert("smartgrid");
        assertTrue(trie.search("smartcity"));
        assertTrue(trie.search("smartgrid"));
        assertFalse(trie.search("smart"));
        assertTrue(trie.startsWith("smart"));
        assertFalse(trie.startsWith("grid"));

        // 5. Custom Priority Queue
        CustomDataStructures.CustomPriorityQueue pq = new CustomDataStructures.CustomPriorityQueue();
        pq.insert(5.5);
        pq.insert(2.2);
        pq.insert(9.9);
        pq.insert(1.1);
        assertEquals(1.1, pq.extractMin(), 0.0001);
        assertEquals(2.2, pq.extractMin(), 0.0001);
        assertEquals(5.5, pq.extractMin(), 0.0001);
        assertEquals(9.9, pq.extractMin(), 0.0001);

        // 6. Union Find (DSU)
        CustomDataStructures.UnionFind dsu = new CustomDataStructures.UnionFind(5);
        assertTrue(dsu.union(0, 1));
        assertTrue(dsu.union(1, 2));
        assertFalse(dsu.union(0, 2)); // Already unioned
        assertEquals(dsu.find(0), dsu.find(2));
        assertNotEquals(dsu.find(0), dsu.find(3));

        // 7. Custom Hash Map
        CustomDataStructures.CustomHashMap<String, Integer> map = new CustomDataStructures.CustomHashMap<>();
        map.put("Delhi", 11);
        map.put("Mumbai", 22);
        assertEquals(11, map.get("Delhi"));
        assertEquals(22, map.get("Mumbai"));
        map.put("Delhi", 99); // Update key
        assertEquals(99, map.get("Delhi"));
        assertTrue(map.remove("Mumbai"));
        assertNull(map.get("Mumbai"));
    }

    @Test
    public void testGraphAlgorithms() {
        // Setup graph
        List<String> nodes = Arrays.asList("A", "B", "C", "D");
        List<GraphAlgorithms.Edge> edges = Arrays.asList(
                new GraphAlgorithms.Edge("A", "B", 1.0),
                new GraphAlgorithms.Edge("B", "C", 2.0),
                new GraphAlgorithms.Edge("A", "C", 4.0),
                new GraphAlgorithms.Edge("C", "D", 1.0)
        );

        Map<String, List<GraphAlgorithms.Edge>> adjList = new HashMap<>();
        for (String node : nodes) adjList.put(node, new ArrayList<>());
        for (GraphAlgorithms.Edge edge : edges) {
            adjList.get(edge.source).add(edge);
        }

        // 1. BFS & DFS
        GraphAlgorithms.BfsDfsResult bfs = GraphAlgorithms.runBfs(adjList, "A");
        assertEquals(Arrays.asList("A", "B", "C", "D"), bfs.traversal);

        GraphAlgorithms.BfsDfsResult dfs = GraphAlgorithms.runDfs(adjList, "A");
        assertEquals(Arrays.asList("A", "B", "C", "D"), dfs.traversal);

        // 2. Dijkstra
        GraphAlgorithms.PathResult dijkstra = GraphAlgorithms.runDijkstra(adjList, "A", "C");
        assertEquals(Arrays.asList("A", "B", "C"), dijkstra.path);
        assertEquals(3.0, dijkstra.totalCost, 0.0001);

        // 3. A* (A-Star)
        Map<String, double[]> coordinates = new HashMap<>();
        coordinates.put("A", new double[]{0.0, 0.0});
        coordinates.put("B", new double[]{1.0, 0.0});
        coordinates.put("C", new double[]{1.0, 2.0});
        coordinates.put("D", new double[]{2.0, 2.0});
        GraphAlgorithms.PathResult astar = GraphAlgorithms.runAStar(adjList, coordinates, "A", "C");
        assertEquals(Arrays.asList("A", "B", "C"), astar.path);
        assertEquals(3.0, astar.totalCost, 0.0001);

        // 4. Bellman-Ford
        GraphAlgorithms.PathResult bellman = GraphAlgorithms.runBellmanFord(nodes, edges, "A", "C");
        assertEquals(Arrays.asList("A", "B", "C"), bellman.path);
        assertEquals(3.0, bellman.totalCost, 0.0001);

        // 5. Floyd-Warshall
        GraphAlgorithms.FloydWarshallResult floyd = GraphAlgorithms.runFloydWarshall(nodes, edges);
        assertEquals(0.0, floyd.distances.get("A").get("A"), 0.0001);
        assertEquals(1.0, floyd.distances.get("A").get("B"), 0.0001);
        assertEquals(3.0, floyd.distances.get("A").get("C"), 0.0001);
        assertEquals(4.0, floyd.distances.get("A").get("D"), 0.0001);

        // 6. Prim
        Map<String, List<GraphAlgorithms.Edge>> undirectedAdj = new HashMap<>();
        for (String node : nodes) undirectedAdj.put(node, new ArrayList<>());
        for (GraphAlgorithms.Edge edge : edges) {
            undirectedAdj.get(edge.source).add(edge);
            undirectedAdj.get(edge.target).add(new GraphAlgorithms.Edge(edge.target, edge.source, edge.weight));
        }
        GraphAlgorithms.MstResult prim = GraphAlgorithms.runPrim(nodes, undirectedAdj);
        assertEquals(4.0, prim.totalWeight, 0.0001);

        // 7. Kruskal
        GraphAlgorithms.MstResult kruskal = GraphAlgorithms.runKruskal(nodes, edges);
        assertEquals(4.0, kruskal.totalWeight, 0.0001);
    }

    @Test
    public void testDpGreedyAlgorithms() {
        // 1. 0/1 Knapsack
        int[] weights = {1, 2, 3, 5};
        int[] values = {1, 6, 10, 16};
        int capacity = 7;
        DpGreedyAlgorithms.KnapsackResult r = DpGreedyAlgorithms.solveKnapsack(weights, values, capacity);
        assertEquals(22, r.maxValue);
        assertEquals(Arrays.asList(1, 3), r.selectedIndices);

        // 2. Activity Selection
        int[] start = {1, 3, 0, 5, 8, 5};
        int[] end = {2, 4, 6, 7, 9, 9};
        List<Integer> greedy = DpGreedyAlgorithms.selectActivities(start, end);
        assertEquals(Arrays.asList(0, 1, 3, 4), greedy);
    }

    @Test
    public void testSortingSearching() {
        int[] arr = {9, 2, 5, 1, 7, 4, 8, 3, 6};

        // Sorting
        assertArrayEquals(new int[]{1, 2, 3, 4, 5, 6, 7, 8, 9}, SortingSearching.bubbleSort(arr));
        assertArrayEquals(new int[]{1, 2, 3, 4, 5, 6, 7, 8, 9}, SortingSearching.quickSort(arr));
        assertArrayEquals(new int[]{1, 2, 3, 4, 5, 6, 7, 8, 9}, SortingSearching.mergeSort(arr));
        assertArrayEquals(new int[]{1, 2, 3, 4, 5, 6, 7, 8, 9}, SortingSearching.heapSort(arr));

        // Searching
        assertEquals(3, SortingSearching.linearSearch(arr, 1));
        assertEquals(-1, SortingSearching.linearSearch(arr, 99));

        int[] sorted = {1, 2, 3, 4, 5, 6, 7, 8, 9};
        assertEquals(4, SortingSearching.binarySearch(sorted, 5));
        assertEquals(-1, SortingSearching.binarySearch(sorted, 99));
    }
}
