package com.smartcity.engine.algorithms;

import java.util.ArrayList;
import java.util.List;

public class CustomDataStructures {

    // 1. Linked List
    public static class SinglyLinkedList<T> {
        public static class Node<T> {
            public T data;
            public Node<T> next;
            public Node(T data) { this.data = data; }
        }
        private Node<T> head;
        public void insert(T data) {
            Node<T> newNode = new Node<>(data);
            if (head == null) {
                head = newNode;
                return;
            }
            Node<T> curr = head;
            while (curr.next != null) {
                curr = curr.next;
            }
            curr.next = newNode;
        }
        public boolean delete(T data) {
            if (head == null) return false;
            if (head.data.equals(data)) {
                head = head.next;
                return true;
            }
            Node<T> curr = head;
            while (curr.next != null && !curr.next.data.equals(data)) {
                curr = curr.next;
            }
            if (curr.next != null) {
                curr.next = curr.next.next;
                return true;
            }
            return false;
        }
        public List<T> toList() {
            List<T> list = new ArrayList<>();
            Node<T> curr = head;
            while (curr != null) {
                list.add(curr.data);
                curr = curr.next;
            }
            return list;
        }
    }

    // 2. Stack
    public static class Stack<T> {
        private final List<T> list = new ArrayList<>();
        public void push(T data) { list.add(data); }
        public T pop() {
            if (isEmpty()) throw new IllegalStateException("Stack is empty");
            return list.remove(list.size() - 1);
        }
        public T peek() {
            if (isEmpty()) throw new IllegalStateException("Stack is empty");
            return list.get(list.size() - 1);
        }
        public boolean isEmpty() { return list.isEmpty(); }
        public List<T> toList() { return new ArrayList<>(list); }
    }

    // 3. Queue
    public static class Queue<T> {
        private final List<T> list = new ArrayList<>();
        public void enqueue(T data) { list.add(data); }
        public T dequeue() {
            if (isEmpty()) throw new IllegalStateException("Queue is empty");
            return list.remove(0);
        }
        public T peek() {
            if (isEmpty()) throw new IllegalStateException("Queue is empty");
            return list.get(0);
        }
        public boolean isEmpty() { return list.isEmpty(); }
        public List<T> toList() { return new ArrayList<>(list); }
    }

    // 4. Trie
    public static class Trie {
        public static class TrieNode {
            public TrieNode[] children = new TrieNode[26];
            public boolean isEndOfWord;
        }
        private final TrieNode root = new TrieNode();
        public void insert(String word) {
            TrieNode node = root;
            for (char ch : word.toLowerCase().toCharArray()) {
                if (ch < 'a' || ch > 'z') continue;
                int index = ch - 'a';
                if (node.children[index] == null) {
                    node.children[index] = new TrieNode();
                }
                node = node.children[index];
            }
            node.isEndOfWord = true;
        }
        public boolean search(String word) {
            TrieNode node = root;
            for (char ch : word.toLowerCase().toCharArray()) {
                if (ch < 'a' || ch > 'z') return false;
                int index = ch - 'a';
                if (node.children[index] == null) return false;
                node = node.children[index];
            }
            return node.isEndOfWord;
        }
        public boolean startsWith(String prefix) {
            TrieNode node = root;
            for (char ch : prefix.toLowerCase().toCharArray()) {
                if (ch < 'a' || ch > 'z') return false;
                int index = ch - 'a';
                if (node.children[index] == null) return false;
                node = node.children[index];
            }
            return true;
        }
    }

    // 5. Custom Priority Queue (Min-Heap)
    public static class CustomPriorityQueue {
        private final List<Double> heap = new ArrayList<>();
        public void insert(double val) {
            heap.add(val);
            siftUp(heap.size() - 1);
        }
        public double extractMin() {
            if (heap.isEmpty()) throw new IllegalStateException("Priority Queue is empty");
            double min = heap.get(0);
            double last = heap.remove(heap.size() - 1);
            if (!heap.isEmpty()) {
                heap.set(0, last);
                siftDown(0);
            }
            return min;
        }
        public double peek() {
            if (heap.isEmpty()) throw new IllegalStateException("Priority Queue is empty");
            return heap.get(0);
        }
        public boolean isEmpty() { return heap.isEmpty(); }
        public List<Double> toList() { return new ArrayList<>(heap); }
        private void siftUp(int index) {
            while (index > 0) {
                int parent = (index - 1) / 2;
                if (heap.get(index) >= heap.get(parent)) break;
                swap(index, parent);
                index = parent;
            }
        }
        private void siftDown(int index) {
            int size = heap.size();
            while (index * 2 + 1 < size) {
                int left = index * 2 + 1;
                int right = index * 2 + 2;
                int smallest = left;
                if (right < size && heap.get(right) < heap.get(left)) {
                    smallest = right;
                }
                if (heap.get(index) <= heap.get(smallest)) break;
                swap(index, smallest);
                index = smallest;
            }
        }
        private void swap(int i, int j) {
            double temp = heap.get(i);
            heap.set(i, heap.get(j));
            heap.set(j, temp);
        }
    }

    // 6. Union Find (DSU)
    public static class UnionFind {
        private final int[] parent;
        private final int[] rank;
        public UnionFind(int size) {
            parent = new int[size];
            rank = new int[size];
            for (int i = 0; i < size; i++) parent[i] = i;
        }
        public int find(int i) {
            if (parent[i] == i) return i;
            parent[i] = find(parent[i]); // Path compression
            return parent[i];
        }
        public boolean union(int i, int j) {
            int rootI = find(i);
            int rootJ = find(j);
            if (rootI == rootJ) return false;
            if (rank[rootI] < rank[rootJ]) {
                parent[rootI] = rootJ;
            } else if (rank[rootI] > rank[rootJ]) {
                parent[rootJ] = rootI;
            } else {
                parent[rootJ] = rootI;
                rank[rootI]++;
            }
            return true;
        }
    }

    // 7. Custom Hash Map (Chaining)
    public static class CustomHashMap<K, V> {
        private static class Entry<K, V> {
            K key;
            V value;
            Entry<K, V> next;
            Entry(K key, V value) { this.key = key; this.value = value; }
        }
        private final Entry<K, V>[] buckets;
        private final int capacity = 16;
        @SuppressWarnings("unchecked")
        public CustomHashMap() {
            buckets = new Entry[capacity];
        }
        public void put(K key, V value) {
            int bucket = Math.abs(key.hashCode()) % capacity;
            Entry<K, V> head = buckets[bucket];
            while (head != null) {
                if (head.key.equals(key)) {
                    head.value = value;
                    return;
                }
                head = head.next;
            }
            Entry<K, V> entry = new Entry<>(key, value);
            entry.next = buckets[bucket];
            buckets[bucket] = entry;
        }
        public V get(K key) {
            int bucket = Math.abs(key.hashCode()) % capacity;
            Entry<K, V> head = buckets[bucket];
            while (head != null) {
                if (head.key.equals(key)) return head.value;
                head = head.next;
            }
            return null;
        }
        public boolean remove(K key) {
            int bucket = Math.abs(key.hashCode()) % capacity;
            Entry<K, V> head = buckets[bucket];
            Entry<K, V> prev = null;
            while (head != null) {
                if (head.key.equals(key)) {
                    if (prev == null) buckets[bucket] = head.next;
                    else prev.next = head.next;
                    return true;
                }
                prev = head;
                head = head.next;
            }
            return false;
        }
        public List<String> entryList() {
            List<String> list = new ArrayList<>();
            for (int i = 0; i < capacity; i++) {
                Entry<K, V> head = buckets[i];
                while (head != null) {
                    list.add(head.key + "=" + head.value);
                    head = head.next;
                }
            }
            return list;
        }
    }
}
