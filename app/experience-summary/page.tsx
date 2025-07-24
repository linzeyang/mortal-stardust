'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExperienceSummary } from '@/components/experience/experience-summary'
import { ExperienceSummaryList } from '@/components/experience/experience-summary-list'
import { 
  Brain, 
  Sparkles, 
  TrendingUp,
  FileText,
  Search,
  Plus,
  ArrowLeft
} from 'lucide-react'

interface Experience {
  _id: string
  user_id: string
  role: string
  content: any
  created_at: string
  updated_at: string
}

export default function ExperienceSummaryPage() {
  const [activeTab, setActiveTab] = useState('browse')
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (activeTab === 'generate') {
      loadExperiences()
    }
  }, [activeTab])

  const loadExperiences = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/experiences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExperiences(data.experiences || [])
      }
    } catch (err) {
      console.error('Failed to load experiences:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewSummary = (summaryId: string, experienceId: string) => {
    setSelectedExperienceId(experienceId)
    setActiveTab('view')
  }

  const handleBackToList = () => {
    setSelectedExperienceId(null)
    setActiveTab('browse')
  }

  const filteredExperiences = experiences.filter(exp => 
    exp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exp.content?.text && exp.content.text.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'student': return 'default'
      case 'workplace_newcomer': return 'secondary'
      case 'entrepreneur': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className=\"min-h-screen bg-gray-50\">
      <div className=\"container mx-auto px-4 py-8\">
        {/* Header */}
        <div className=\"mb-8 text-center\">
          <div className=\"flex items-center justify-center gap-3 mb-4\">
            <Brain className=\"w-8 h-8 text-blue-600\" />
            <h1 className=\"text-3xl font-bold text-gray-900\">Experience Summarization</h1>
          </div>
          <p className=\"text-lg text-gray-600 max-w-2xl mx-auto\">
            Generate AI-powered summaries of your life experiences to gain insights, 
            track progress, and understand your personal growth journey.
          </p>
        </div>

        {/* Main Content */}
        {selectedExperienceId && activeTab === 'view' ? (
          <div className=\"space-y-6\">
            <div className=\"flex items-center gap-4\">
              <Button variant=\"outline\" onClick={handleBackToList}>
                <ArrowLeft className=\"w-4 h-4 mr-2\" />
                Back to Summaries
              </Button>
              <h2 className=\"text-xl font-semibold\">Experience Summary</h2>
            </div>
            <ExperienceSummary experienceId={selectedExperienceId} />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className=\"w-full\">
            <TabsList className=\"grid w-full grid-cols-3 max-w-md mx-auto\">
              <TabsTrigger value=\"browse\">
                <FileText className=\"w-4 h-4 mr-2\" />
                Browse
              </TabsTrigger>
              <TabsTrigger value=\"generate\">
                <Sparkles className=\"w-4 h-4 mr-2\" />
                Generate
              </TabsTrigger>
              <TabsTrigger value=\"insights\">
                <TrendingUp className=\"w-4 h-4 mr-2\" />
                Insights
              </TabsTrigger>
            </TabsList>

            {/* Browse Summaries Tab */}
            <TabsContent value=\"browse\" className=\"mt-8\">
              <ExperienceSummaryList onViewSummary={handleViewSummary} />
            </TabsContent>

            {/* Generate New Summary Tab */}
            <TabsContent value=\"generate\" className=\"mt-8\">
              <div className=\"space-y-6\">
                <Card>
                  <CardHeader>
                    <CardTitle className=\"flex items-center gap-2\">
                      <Plus className=\"w-5 h-5\" />
                      Generate New Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className=\"text-gray-600 mb-6\">
                      Select an experience below to generate an AI-powered summary. 
                      The summary will analyze your experience across multiple dimensions 
                      including emotional journey, progress tracking, and solution effectiveness.
                    </p>

                    {/* Search experiences */}
                    <div className=\"mb-6\">
                      <div className=\"relative\">
                        <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4\" />
                        <Input
                          placeholder=\"Search your experiences...\"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className=\"pl-10\"
                        />
                      </div>
                    </div>

                    {/* Experience list */}
                    {loading ? (
                      <div className=\"text-center py-8\">
                        <div className=\"animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4\"></div>
                        <p className=\"text-gray-600\">Loading experiences...</p>
                      </div>
                    ) : filteredExperiences.length === 0 ? (
                      <div className=\"text-center py-8\">
                        <FileText className=\"w-12 h-12 mx-auto mb-4 text-gray-400\" />
                        <p className=\"text-gray-600 mb-4\">
                          {experiences.length === 0 
                            ? \"No experiences found. Create an experience first to generate summaries.\"
                            : \"No experiences match your search.\"
                          }
                        </p>
                        {experiences.length === 0 && (
                          <Button onClick={() => window.location.href = '/experience'}>
                            <Plus className=\"w-4 h-4 mr-2\" />
                            Create Experience
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
                        {filteredExperiences.map((experience) => (
                          <Card 
                            key={experience._id} 
                            className=\"hover:shadow-md transition-shadow cursor-pointer\"
                            onClick={() => {
                              setSelectedExperienceId(experience._id)
                              setActiveTab('view')
                            }}
                          >
                            <CardHeader className=\"pb-3\">
                              <div className=\"flex justify-between items-start\">
                                <Badge variant={getRoleBadgeVariant(experience.role)}>
                                  {experience.role.replace('_', ' ').replace(/^./, str => str.toUpperCase())}
                                </Badge>
                                <div className=\"text-xs text-gray-500\">
                                  {new Date(experience.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className=\"pt-0\">
                              <div className=\"space-y-2\">
                                <div className=\"text-sm text-gray-600 line-clamp-3\">
                                  {experience.content?.text 
                                    ? experience.content.text.substring(0, 150) + '...'
                                    : 'Multimodal experience (contains media content)'
                                  }
                                </div>
                                <div className=\"flex items-center gap-2 text-xs text-gray-500\">
                                  <FileText className=\"w-3 h-3\" />
                                  Experience ID: {experience._id.slice(-8)}...
                                </div>
                              </div>
                              <Button size=\"sm\" className=\"w-full mt-4\">
                                <Sparkles className=\"w-4 h-4 mr-2\" />
                                Generate Summary
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value=\"insights\" className=\"mt-8\">
              <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
                <Card>
                  <CardHeader>
                    <CardTitle className=\"flex items-center gap-2\">
                      <Brain className=\"w-5 h-5 text-blue-600\" />
                      AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className=\"text-gray-600 mb-4\">
                      Our AI analyzes your experiences across multiple dimensions:
                    </p>
                    <ul className=\"space-y-2 text-sm\">
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-blue-500 rounded-full\"></div>
                        Emotional journey mapping
                      </li>
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-green-500 rounded-full\"></div>
                        Progress tracking over time
                      </li>
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-purple-500 rounded-full\"></div>
                        Solution effectiveness analysis
                      </li>
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-orange-500 rounded-full\"></div>
                        Multimodal content insights
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className=\"flex items-center gap-2\">
                      <TrendingUp className=\"w-5 h-5 text-green-600\" />
                      Personal Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className=\"text-gray-600 mb-4\">
                      Track your personal development journey:
                    </p>
                    <ul className=\"space-y-2 text-sm\">
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-green-500 rounded-full\"></div>
                        Key insights extraction
                      </li>
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-blue-500 rounded-full\"></div>
                        Behavioral pattern recognition
                      </li>
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-purple-500 rounded-full\"></div>
                        Achievement milestones
                      </li>
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-orange-500 rounded-full\"></div>
                        Growth area identification
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className=\"flex items-center gap-2\">
                      <Sparkles className=\"w-5 h-5 text-purple-600\" />
                      Smart Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className=\"text-gray-600 mb-4\">
                      Advanced summarization capabilities:
                    </p>
                    <ul className=\"space-y-2 text-sm\">
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-purple-500 rounded-full\"></div>
                        Multi-stage analysis
                      </li>
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-blue-500 rounded-full\"></div>
                        Encrypted data processing
                      </li>
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-green-500 rounded-full\"></div>
                        Personalized recommendations
                      </li>
                      <li className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-orange-500 rounded-full\"></div>
                        Export and sharing options
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Getting Started Guide */}
              <Card className=\"mt-6\">
                <CardHeader>
                  <CardTitle>Getting Started with Experience Summaries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
                    <div className=\"text-center\">
                      <div className=\"w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4\">
                        <FileText className=\"w-6 h-6 text-blue-600\" />
                      </div>
                      <h3 className=\"font-medium mb-2\">1. Create Experiences</h3>
                      <p className=\"text-sm text-gray-600\">
                        Share your life experiences using our multimodal input system with text, audio, images, and video.
                      </p>
                    </div>
                    <div className=\"text-center\">
                      <div className=\"w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4\">
                        <Sparkles className=\"w-6 h-6 text-green-600\" />
                      </div>
                      <h3 className=\"font-medium mb-2\">2. Generate Summaries</h3>
                      <p className=\"text-sm text-gray-600\">
                        Let our AI analyze your experiences and generate comprehensive summaries with actionable insights.
                      </p>
                    </div>
                    <div className=\"text-center\">
                      <div className=\"w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4\">
                        <TrendingUp className=\"w-6 h-6 text-purple-600\" />
                      </div>
                      <h3 className=\"font-medium mb-2\">3. Track Progress</h3>
                      <p className=\"text-sm text-gray-600\">
                        Monitor your personal growth journey and identify patterns in your experiences over time.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}