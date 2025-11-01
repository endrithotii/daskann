import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Trophy, Users, TrendingUp } from 'lucide-react';

interface AIGroup {
  id: string;
  label: string;
  criteria: string;
  members: number[];
  count: number;
}

interface AIConsensus {
  group_id: string;
  label: string;
  confidence: number;
  reasoning: string;
}

interface AIAnalysis {
  question: string;
  groups: AIGroup[];
  consensus: AIConsensus;
}

interface Discussion {
  id: string;
  title: string;
  prompt: string;
  status: string;
  ai_analysis: AIAnalysis | null;
  results_summary: string;
}

export const ResultsPage = ({ discussionId, onBack }: {
  discussionId: string;
  onBack: () => void;
}) => {
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscussionResults();
  }, [discussionId]);

  const fetchDiscussionResults = async () => {
    try {
      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .eq('id', discussionId)
        .single();

      if (error) throw error;
      setDiscussion(data);
    } catch (error) {
      console.error('Error fetching discussion results:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerAIAnalysis = async () => {
    if (!discussion) return;

    setAnalyzing(true);
    setError(null);

    try {
      const { data: responses, error: responsesError } = await supabase
        .from('responses')
        .select('text')
        .eq('discussion_id', discussionId);

      if (responsesError) throw responsesError;

      if (!responses || responses.length === 0) {
        setError('No responses to analyze');
        return;
      }

      console.log('Calling AI analysis with', responses.length, 'responses');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const analysisResponse = await fetch(
        `${supabaseUrl}/functions/v1/analyze-discussion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            question: discussion.prompt,
            responses: responses.map((r) => r.text),
          }),
        }
      );

      console.log('AI Analysis Response status:', analysisResponse.status);
      const responseText = await analysisResponse.text();
      console.log('AI Analysis Response:', responseText);

      if (!analysisResponse.ok) {
        try {
          const errorData = JSON.parse(responseText);
          const errorMsg = errorData.details || errorData.error || responseText;
          setError(`Error: ${errorMsg}`);
          console.error('Detailed error:', errorData);
        } catch {
          setError(`API Error (${analysisResponse.status}): ${responseText}`);
        }
        return;
      }

      const aiAnalysis = JSON.parse(responseText);

      const { error: updateError } = await supabase
        .from('discussions')
        .update({ ai_analysis: aiAnalysis })
        .eq('id', discussionId);

      if (updateError) throw updateError;

      await fetchDiscussionResults();
    } catch (err: any) {
      console.error('Error triggering AI analysis:', err);
      setError(err.message || 'Failed to analyze discussion');
    } finally {
      setAnalyzing(false);
    }
  }

  const renderPieChart = (groups: AIGroup[], consensusId: string) => {
    const total = groups.reduce((sum, g) => sum + g.count, 0);
    const colors = [
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#EC4899',
      '#14B8A6',
      '#F97316',
    ];

    let currentAngle = -90;
    const centerX = 150;
    const centerY = 150;
    const radius = 120;

    const paths = groups.map((group, index) => {
      const percentage = (group.count / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');

      const isConsensus = group.id === consensusId;
      const color = isConsensus ? '#10B981' : colors[index % colors.length];

      return (
        <g key={group.id}>
          <path
            d={pathData}
            fill={color}
            stroke="white"
            strokeWidth="2"
            className="transition-all hover:opacity-80 cursor-pointer"
          >
            <title>{`${group.label}: ${percentage.toFixed(1)}%`}</title>
          </path>
        </g>
      );
    });

    return (
      <svg width="300" height="300" viewBox="0 0 300 300" className="mx-auto">
        {paths}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading results...</div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Discussion not found</div>
      </div>
    );
  }

  const aiAnalysis = discussion.ai_analysis;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{discussion.title}</h1>
          <p className="text-gray-600 mb-4">{discussion.prompt}</p>
          <div className="flex items-center space-x-2 text-sm">
            <span
              className={`px-3 py-1 rounded-full ${
                discussion.status === 'closed'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {discussion.status === 'closed' ? 'Closed' : 'Open'}
            </span>
          </div>
        </div>

        {!aiAnalysis ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">{discussion.results_summary}</p>
            <p className="text-sm text-gray-500 mt-2 mb-4">
              AI analysis is not available for this discussion.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              onClick={triggerAIAnalysis}
              disabled={analyzing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {analyzing ? 'Analyzing...' : 'Generate AI Analysis'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg shadow-lg p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Trophy className="w-8 h-8 text-green-600 mt-1" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Consensus Reached: {aiAnalysis.consensus.label}
                  </h2>
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-semibold text-green-700">
                      Confidence: {(aiAnalysis.consensus.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {aiAnalysis.consensus.reasoning}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Users className="w-6 h-6 text-blue-600" />
                <span>Response Distribution</span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex items-center justify-center">
                  {renderPieChart(aiAnalysis.groups, aiAnalysis.consensus.group_id)}
                </div>

                <div className="space-y-4">
                  {aiAnalysis.groups.map((group, index) => {
                    const total = aiAnalysis.groups.reduce((sum, g) => sum + g.count, 0);
                    const percentage = ((group.count / total) * 100).toFixed(1);
                    const isConsensus = group.id === aiAnalysis.consensus.group_id;

                    return (
                      <div
                        key={group.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isConsensus
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                            <span
                              className="w-4 h-4 rounded-full inline-block"
                              style={{
                                backgroundColor: isConsensus
                                  ? '#10B981'
                                  : [
                                      '#3B82F6',
                                      '#10B981',
                                      '#F59E0B',
                                      '#EF4444',
                                      '#8B5CF6',
                                      '#EC4899',
                                      '#14B8A6',
                                      '#F97316',
                                    ][index % 8],
                              }}
                            />
                            <span>{group.label}</span>
                            {isConsensus && (
                              <Trophy className="w-4 h-4 text-green-600" />
                            )}
                          </h4>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {percentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {group.count} response{group.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{group.criteria}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">About this Analysis</h4>
              <p className="text-sm text-blue-800">
                This consensus analysis was generated using AI to identify common themes and
                preferences among all responses. The confidence score reflects how strongly the
                responses align with the identified consensus.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
