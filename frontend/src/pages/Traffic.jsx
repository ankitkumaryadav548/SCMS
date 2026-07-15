import React, { useState } from 'react';
import API from '../services/api';
import { Play, Navigation, AlertCircle, Info } from 'lucide-react';

const Traffic = () => {
  const [startNode, setStartNode] = useState('Node1');
  const [endNode, setEndNode] = useState('Node5');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRouteCalculation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await API.post('/traffic/optimize-route', { startNode, endNode });
      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.message || 'Routing failure.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Algorithm Engine connection offline. Start the Spring Boot service.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Dijkstra Traffic Router</h1>
        <p className="text-darkbg-textMuted text-sm mt-1">
          Compute the absolute shortest path and minimal latency routes using our Java Spring Boot DSA Engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Router Controller Card */}
        <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-6 shadow-lg h-fit">
          <h2 className="text-lg font-bold text-white mb-4">Route Planner</h2>
          
          <form onSubmit={handleRouteCalculation} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-2">
                Origin Intersection
              </label>
              <select
                value={startNode}
                onChange={(e) => setStartNode(e.target.value)}
                className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="Node1">Intersection 1 (Node 1)</option>
                <option value="Node2">Intersection 2 (Node 2)</option>
                <option value="Node3">Intersection 3 (Node 3)</option>
                <option value="Node4">Intersection 4 (Node 4)</option>
                <option value="Node5">Intersection 5 (Node 5)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-2">
                Destination Intersection
              </label>
              <select
                value={endNode}
                onChange={(e) => setEndNode(e.target.value)}
                className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="Node1">Intersection 1 (Node 1)</option>
                <option value="Node2">Intersection 2 (Node 2)</option>
                <option value="Node3">Intersection 3 (Node 3)</option>
                <option value="Node4">Intersection 4 (Node 4)</option>
                <option value="Node5">Intersection 5 (Node 5)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-200 mt-4 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Calculating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Dispatch Pathfinding
                </>
              )}
            </button>
          </form>
        </div>

        {/* Console Result Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-6 shadow-lg min-h-[280px] flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4">Algorithm Console Output</h2>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 text-rose-400 text-sm flex items-start gap-3 my-auto">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Calculation Error</h4>
                  <p className="mt-1 text-xs opacity-90">{error}</p>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="text-center my-auto py-8">
                <Navigation className="h-12 w-12 text-darkbg-textMuted mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-darkbg-textMuted">
                  Select nodes and trigger Dijkstra to print optimal transit schedules.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-6 my-auto">
                <div className="bg-darkbg-pure border border-darkbg-border rounded-lg p-5">
                  <div className="flex justify-between border-b border-darkbg-border pb-3 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted">Telemetry Value</span>
                    <span className="text-xs text-brand-500 font-medium">Computed in {result.executionTime}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {result.path.map((node, index) => (
                      <React.Fragment key={node}>
                        <span className="bg-darkbg-border text-white text-xs px-3 py-1.5 rounded-lg border border-darkbg-border font-mono font-semibold">
                          {node}
                        </span>
                        {index < result.path.length - 1 && (
                          <span className="text-brand-500 font-bold">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-darkbg-pure border border-darkbg-border rounded-lg p-4">
                    <span className="text-xxs uppercase tracking-wider text-darkbg-textMuted block mb-1">Estimated Cost / Delay</span>
                    <span className="text-xl font-bold text-white">{result.totalCost === -1 ? 'Infinite (Unreachable)' : `${result.totalCost} min`}</span>
                  </div>
                  <div className="bg-darkbg-pure border border-darkbg-border rounded-lg p-4">
                    <span className="text-xxs uppercase tracking-wider text-darkbg-textMuted block mb-1">Routing Engine</span>
                    <span className="text-xl font-bold text-brand-500">Java Spring Boot</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-5 flex items-start gap-4">
            <Info className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
            <div className="text-xs text-darkbg-textMuted leading-relaxed">
              <strong className="text-white block mb-1">About shortest path routing:</strong>
              The backend queries the Java-based DSA Engine over high-speed REST endpoints. The engine loads node locations, factors real-time congestion weights, and yields optimized routing data utilizing custom Dijkstra implementations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Traffic;
