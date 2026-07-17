package com.smartcity.engine.algorithms;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class DpGreedyAlgorithms {

    // 1. Dynamic Programming - 0/1 Knapsack
    public static class KnapsackResult {
        public int maxValue;
        public List<Integer> selectedIndices;
        public KnapsackResult(int maxValue, List<Integer> selectedIndices) {
            this.maxValue = maxValue;
            this.selectedIndices = selectedIndices;
        }
    }

    public static KnapsackResult solveKnapsack(int[] weights, int[] values, int capacity) {
        int n = weights.length;
        int[][] dp = new int[n + 1][capacity + 1];

        for (int i = 1; i <= n; i++) {
            for (int w = 0; w <= capacity; w++) {
                if (weights[i - 1] <= w) {
                    dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
                } else {
                    dp[i][w] = dp[i - 1][w];
                }
            }
        }

        List<Integer> selected = new ArrayList<>();
        int w = capacity;
        for (int i = n; i > 0; i--) {
            if (dp[i][w] != dp[i - 1][w]) {
                selected.add(i - 1);
                w -= weights[i - 1];
            }
        }
        Collections.reverse(selected);
        return new KnapsackResult(dp[n][capacity], selected);
    }

    // 2. Greedy - Activity Selection
    public static class Activity {
        public int index;
        public int start;
        public int end;
        public Activity(int index, int start, int end) {
            this.index = index;
            this.start = start;
            this.end = end;
        }
    }

    public static List<Integer> selectActivities(int[] startTimes, int[] endTimes) {
        int n = startTimes.length;
        List<Activity> activities = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            activities.add(new Activity(i, startTimes[i], endTimes[i]));
        }

        activities.sort(Comparator.comparingInt(a -> a.end));

        List<Integer> selected = new ArrayList<>();
        if (activities.isEmpty()) return selected;

        Activity lastSelected = activities.get(0);
        selected.add(lastSelected.index);

        for (int i = 1; i < n; i++) {
            Activity current = activities.get(i);
            if (current.start >= lastSelected.end) {
                selected.add(current.index);
                lastSelected = current;
            }
        }
        return selected;
    }
}
