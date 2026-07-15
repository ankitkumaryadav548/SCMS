import React, { useState } from 'react';
import API from '../services/api';
import { Network, Zap, CheckCircle, HelpCircle } from 'lucide-react';

const Utility = () => {
  const [nodeList, setNodeList] = useState('SubstationA, ReservoirB, DistributaryC, StationD, GridE');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMstCalculation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const nodesArr = nodeList.split(',').map((s) => s.trim()).filter(Boolean);

    if (nodesArr.length < 2) {
      setError('Please enter at least 2 distinct grid nodes.');
      setLoading(false);
      return;
    }

    try {
      // Mock call to /utility/optimize-distribution
      const response = await API.post('/utility/optimize-distribution', { nodeIds: nodesArr });
      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.message || 'Optimization failed.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Algorithm Engine offline. Verify Spring Boot Java Engine is active.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Kruskal utility MST Optimizer</h1>
        <p className="text-darkbg-textMuted text-sm mt-1">
          Calculate the Minimum Spanning Tree layout configurations for water, gas, or electrical grid expansion.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input panel */}
        <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-6 shadow-lg h-fit">
          <h2 className="text-lg font-bold text-white mb-4">Grid Layout Inputs</h2>
          <form onSubmit={handleMstCalculation} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-2">
                Grid Nodes (Comma Separated)
              </label>
              <textarea
                value={nodeList}
                onChange={(e) => setNodeList(e.target.value)}
                rows={3}
                placeholder="SubstationA, ReservoirB, DistributaryC"
                className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
              <span className="text-xxs text-darkbg-textMuted mt-1 block">
                Nodes available: SubstationA, ReservoirB, DistributaryC, StationD, GridE
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-200 mt-2 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Balancing...
                </>
              ) : (
                <>
                  <Network className="h-4 w-4" />
                  Optimize Connections
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results console */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-6 shadow-lg min-h-[300px] flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4">Topology Results Console</h2>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 text-rose-400 text-sm my-auto">
                <h4 className="font-semibold">Calculation Error</h4>
                <p className="mt-1 text-xs opacity-90">{error}</p>
              </div>
            )}

            {!result && !error && (
              <div className="text-center my-auto py-8">
                <Network className="h-12 w-12 text-darkbg-textMuted mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-darkbg-textMuted">
                  Click 'Optimize Connections' to solve layout graphs via Kruskal's algorithm.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-6 my-auto">
                <div className="bg-darkbg-pure border border-darkbg-border rounded-lg p-5">
                  <div className="flex justify-between border-b border-darkbg-border pb-3 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted">Optimal Edge Connections</span>
                    <span className="text-xs text-brand-500 font-medium">Computed in {result.executionTime}</span>
                  </div>

                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {result.mstEdges.map((edge, index) => (
                      <div key={index} className="flex items-center justify-between text-xs py-1 text-darkbg-text font-mono border-b border-darkbg-border/30 last:border-0">
                        <span className="font-semibold text-white">{edge.source} ➔ {edge.target}</span>
                        <span className="text-brand-500">Weight: {edge.weight}m</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-darkbg-pure border border-darkbg-border rounded-lg p-4">
                    <span className="text-xxs uppercase tracking-wider text-darkbg-textMuted block mb-1">Total Spanning Length</span>
                    <span className="text-xl font-bold text-white">{result.totalCost} m</span>
                  </div>
                  <div className="bg-darkbg-pure border border-darkbg-border rounded-lg p-4">
                    <span className="text-xxs uppercase tracking-wider text-darkbg-textMuted block mb-1">Methodology</span>
                    <span className="text-xl font-bold text-brand-500">Kruskal's MST</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Utility;
