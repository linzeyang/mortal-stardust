import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star, 
  FileText, 
  Download,
  RefreshCw,
  Calendar,
  Target,
  Brain,
  Heart,
  Lightbulb
} from 'lucide-react';

interface AnalyticsData {
  analytics_id: string;
  created_at: string;
  overview: {
    total_solutions: number;
    high_rated_solutions: number;
    rating_statistics: {
      average: number;
      max: number;
      min: number;
    };
  };
  patterns: {
    common_themes: string[];
    success_factors: string[];
    user_demographics: any;
    effectiveness_metrics: any;
  };
  effectiveness: {
    consistency_score: number;
    improvement_rate: number;
  };
  content_analysis: {
    key_findings: string[];
    trends: string[];
  };
  recommendations: Array<{
    category: string;
    recommendation: string;
    priority: string;
  }>;
  metadata: {
    analysis_period: string;
    data_quality_score: number;
    confidence_level: number;
  };
}

interface SolutionAnalyticsProps {
  userId: string;
}

const SolutionAnalytics: React.FC<SolutionAnalyticsProps> = ({ userId }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalyticsData[]>([]);

  const generateAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/solution-analytics/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          min_rating: 70,
          stage_filter: null,
          time_range_days: null 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate analytics');
      }

      const data = await response.json();
      setAnalyticsData(data);
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/solution-analytics/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.analytics_history || []);
      }
    } catch (err) {
      console.error('Failed to load analytics history:', err);
    }
  };

  const exportAnalytics = async (format: 'json' | 'csv' = 'json') => {
    if (!analyticsData) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/solution-analytics/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          analytics_id: analyticsData.analytics_id,
          format 
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solution-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to export analytics:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Solutions</p>
              <p className="text-2xl font-bold">{analyticsData?.overview?.total_solutions || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">High-Rated Solutions</p>
              <p className="text-2xl font-bold">{analyticsData?.overview?.high_rated_solutions || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold">{analyticsData?.overview?.rating_statistics?.average?.toFixed(1) || '0.0'}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Confidence Level</p>
              <p className="text-2xl font-bold">{analyticsData?.metadata?.confidence_level?.toFixed(1) || '0.0'}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPatterns = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Common Themes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analyticsData?.patterns?.common_themes?.map((theme, index) => (
              <Badge key={index} variant="secondary">
                {theme}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5" />
            <span>Success Factors</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData?.patterns?.success_factors?.map((factor, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Effectiveness Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData?.patterns?.effectiveness_metrics && 
              Object.entries(analyticsData.patterns.effectiveness_metrics).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{key.replace('_', ' ')}</span>
                    <span>{typeof value === 'number' ? `${value.toFixed(1)}%` : value}</span>
                  </div>
                  {typeof value === 'number' && (
                    <Progress value={value} className="h-2" />
                  )}
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Key Findings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analyticsData?.content_analysis?.key_findings?.map((finding, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analyticsData?.content_analysis?.trends?.map((trend, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{trend}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analyticsData?.recommendations?.map((rec, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{rec.recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      {history.map((item) => (
        <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setAnalyticsData(item)}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">Analytics Report</h3>
                <p className="text-sm text-gray-600">
                  Generated on {new Date(item.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {item.summary?.total_solutions || 0} solutions
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {item.summary?.average_rating?.toFixed(1) || '0.0'}% avg rating
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <Calendar className="w-4 h-4 inline mr-1" />
                {item.metadata.analysis_period}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solution Analytics</h1>
          <p className="text-gray-600 mt-2">
            Analyze patterns and insights from high-performing solutions
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={generateAnalytics} 
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4" />
            )}
            <span>{loading ? 'Generating...' : 'Generate Analytics'}</span>
          </Button>
          {analyticsData && (
            <Button 
              variant="outline" 
              onClick={() => exportAnalytics('json')}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {analyticsData ? (
        <div>
          {renderOverview()}
          
          <Tabs defaultValue="patterns" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="patterns">Patterns & Metrics</TabsTrigger>
              <TabsTrigger value="insights">Insights & Trends</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="patterns" className="mt-6">
              {renderPatterns()}
            </TabsContent>
            
            <TabsContent value="insights" className="mt-6">
              {renderInsights()}
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              {renderHistory()}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
            <p className="text-gray-600 mb-6">
              Generate your first analytics report to see insights from high-performing solutions
            </p>
            <Button onClick={generateAnalytics} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Analytics'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SolutionAnalytics;