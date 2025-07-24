'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Brain, 
  Search,
  Calendar,
  TrendingUp,
  Filter,
  Eye,
  Trash2,
  RefreshCw,
  BarChart3
} from 'lucide-react'

interface SummaryListItem {
  summary_id: string
  experience_id: string
  stage: string
  created_at: string
  updated_at: string
  summary_score?: number
  tags: string[]
}

interface ExperienceSummaryListProps {
  onViewSummary?: (summaryId: string, experienceId: string) => void
}

export function ExperienceSummaryList({ onViewSummary }: ExperienceSummaryListProps) {
  const [summaries, setSummaries] = useState<SummaryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    loadSummaries()
    loadAnalytics()
  }, [])

  const loadSummaries = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/experience-summarization/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load summaries')
      }

      const data = await response.json()
      setSummaries(data.summaries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summaries')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/experience-summarization/analytics/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    }
  }

  const deleteSummary = async (summaryId: string) => {
    if (!confirm('Are you sure you want to delete this summary?')) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/experience-summarization/${summaryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete summary')
      }

      setSummaries(summaries.filter(s => s.summary_id !== summaryId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete summary')
    }
  }

  const getTagVariant = (tag: string) => {
    switch (tag) {
      case 'high_success':
        return 'default'
      case 'moderate_success':
        return 'secondary'
      case 'needs_improvement':
        return 'destructive'
      case 'positive_growth':
        return 'default'
      case 'multimodal_rich':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getSeverityColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredSummaries = summaries.filter(summary => {
    const matchesSearch = summary.experience_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         summary.stage.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStage = stageFilter === 'all' || summary.stage === stageFilter
    return matchesSearch && matchesStage
  })

  if (loading) {
    return (
      <div className=\"flex items-center justify-center p-8\">
        <RefreshCw className=\"w-6 h-6 animate-spin mr-2\" />
        Loading summaries...
      </div>
    )
  }

  return (
    <div className=\"w-full max-w-6xl mx-auto space-y-6\">
      {/* Analytics Overview */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center gap-2\">
              <BarChart3 className=\"w-5 h-5\" />
              Summary Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-blue-600\">
                  {analytics.total_summaries}
                </div>
                <div className=\"text-sm text-gray-600\">Total Summaries</div>
              </div>
              <div className=\"text-center\">
                <div className={`text-2xl font-bold ${getSeverityColor(analytics.average_score)}`}>
                  {analytics.average_score}%
                </div>
                <div className=\"text-sm text-gray-600\">Average Score</div>
              </div>
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-purple-600\">
                  {Object.keys(analytics.stage_distribution).length}
                </div>
                <div className=\"text-sm text-gray-600\">Active Stages</div>
              </div>
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-green-600\">
                  {Object.keys(analytics.tag_distribution).length}
                </div>
                <div className=\"text-sm text-gray-600\">Unique Tags</div>
              </div>
            </div>

            {/* Stage Distribution */}
            <div className=\"mt-4\">
              <h4 className=\"font-medium mb-2\">Stage Distribution</h4>
              <div className=\"flex flex-wrap gap-2\">
                {Object.entries(analytics.stage_distribution).map(([stage, count]) => (
                  <Badge key={stage} variant=\"outline\">
                    {stage}: {count as number}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className=\"p-4\">
          <div className=\"flex flex-col md:flex-row gap-4\">
            <div className=\"flex-1\">
              <div className=\"relative\">
                <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4\" />
                <Input
                  placeholder=\"Search summaries...\"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className=\"pl-10\"
                />
              </div>
            </div>
            <div className=\"flex gap-2\">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className=\"px-3 py-2 border rounded-md text-sm\"
              >
                <option value=\"all\">All Stages</option>
                <option value=\"stage1\">Stage 1</option>
                <option value=\"stage2\">Stage 2</option>
                <option value=\"stage3\">Stage 3</option>
                <option value=\"all\">Complete</option>
              </select>
              <Button variant=\"outline\" size=\"sm\" onClick={loadSummaries}>
                <RefreshCw className=\"w-4 h-4 mr-2\" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summaries List */}
      {error && (
        <Card>
          <CardContent className=\"p-4 text-center text-red-600\">
            {error}
          </CardContent>
        </Card>
      )}

      {filteredSummaries.length === 0 ? (
        <Card>
          <CardContent className=\"p-8 text-center\">
            <Brain className=\"w-12 h-12 mx-auto mb-4 text-gray-400\" />
            <p className=\"text-gray-600 mb-4\">
              {summaries.length === 0 
                ? \"No experience summaries found. Generate your first summary from an experience page.\"
                : \"No summaries match your current filters.\"
              }
            </p>
            {searchTerm || stageFilter !== 'all' ? (
              <Button variant=\"outline\" onClick={() => {
                setSearchTerm('')
                setStageFilter('all')
              }}>
                Clear Filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
          {filteredSummaries.map((summary) => (
            <Card key={summary.summary_id} className=\"hover:shadow-md transition-shadow\">
              <CardHeader className=\"pb-3\">
                <div className=\"flex justify-between items-start\">
                  <div className=\"flex-1\">
                    <Badge variant=\"outline\" className=\"mb-2\">
                      {summary.stage === 'all' ? 'Complete' : `Stage ${summary.stage.slice(-1)}`}
                    </Badge>
                    <div className=\"text-sm text-gray-600\">
                      Experience: {summary.experience_id.slice(-8)}...
                    </div>
                  </div>
                  {summary.summary_score !== undefined && (
                    <div className={`text-lg font-bold ${getSeverityColor(summary.summary_score)}`}>
                      {summary.summary_score}%
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className=\"pt-0\">
                {/* Tags */}
                {summary.tags.length > 0 && (
                  <div className=\"flex flex-wrap gap-1 mb-3\">
                    {summary.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant={getTagVariant(tag)} className=\"text-xs\">
                        {tag.replace('_', ' ')}
                      </Badge>
                    ))}
                    {summary.tags.length > 3 && (
                      <Badge variant=\"outline\" className=\"text-xs\">
                        +{summary.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Timestamps */}
                <div className=\"space-y-1 mb-4 text-xs text-gray-500\">
                  <div className=\"flex items-center gap-1\">
                    <Calendar className=\"w-3 h-3\" />
                    Created: {new Date(summary.created_at).toLocaleDateString()}
                  </div>
                  {summary.updated_at !== summary.created_at && (
                    <div className=\"flex items-center gap-1\">
                      <RefreshCw className=\"w-3 h-3\" />
                      Updated: {new Date(summary.updated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className=\"flex gap-2\">
                  <Button 
                    size=\"sm\" 
                    variant=\"outline\" 
                    className=\"flex-1\"
                    onClick={() => onViewSummary?.(summary.summary_id, summary.experience_id)}
                  >
                    <Eye className=\"w-4 h-4 mr-2\" />
                    View
                  </Button>
                  <Button 
                    size=\"sm\" 
                    variant=\"outline\"
                    onClick={() => deleteSummary(summary.summary_id)}
                  >
                    <Trash2 className=\"w-4 h-4\" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}