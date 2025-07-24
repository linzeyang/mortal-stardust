import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Database,
  Lock,
  Settings,
  History,
  Info
} from 'lucide-react';

interface ConsentRecord {
  consent_id: string;
  consent_type: string;
  status: 'granted' | 'withdrawn';
  purpose: string;
  created_at: string;
  updated_at: string;
}

interface DataRequest {
  request_id: string;
  request_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  estimated_completion?: string;
  completed_at?: string;
  error_message?: string;
}

interface PrivacyDashboardData {
  user_id: string;
  generated_at: string;
  consents: {
    current_consents: ConsentRecord[];
    consent_history: ConsentRecord[];
    total_records: number;
  };
  data_requests: DataRequest[];
  data_usage: {
    [key: string]: number;
    summary: {
      total_records: number;
      estimated_storage_mb: number;
      last_updated: string;
    };
  };
  retention_policy: {
    account_age_days: number;
    retention_periods: { [key: string]: string };
    next_review_date: string;
  };
  privacy_rights: { [key: string]: string };
}

interface PrivacyCenterProps {
  userId: string;
}

const PrivacyCenter: React.FC<PrivacyCenterProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<PrivacyDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/privacy/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load privacy dashboard');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (consentType: string, granted: boolean, purpose: string) => {
    setActionLoading(`consent-${consentType}`);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consent_type: consentType,
          granted,
          purpose
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update consent');
      }

      await loadDashboard(); // Reload dashboard data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update consent');
    } finally {
      setActionLoading(null);
    }
  };

  const createDataRequest = async (requestType: string, retentionPolicy?: string) => {
    setActionLoading(requestType);
    
    try {
      const token = localStorage.getItem('authToken');
      const requestBody: any = {
        request_type: requestType
      };
      
      if (retentionPolicy) {
        requestBody.retention_policy = retentionPolicy;
      }

      const response = await fetch('/api/privacy/data-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ${requestType} request`);
      }

      const result = await response.json();
      await loadDashboard(); // Reload dashboard data
      
      // Show success message
      alert(`${requestType.charAt(0).toUpperCase() + requestType.slice(1)} request created successfully. Request ID: ${result.request_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to create ${requestType} request`);
    } finally {
      setActionLoading(null);
    }
  };

  const downloadExport = async (requestId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/privacy/export/${requestId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download export');
      }

      const data = await response.json();
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data.export_data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download export');
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  const getConsentStatus = (consentType: string): ConsentRecord | null => {
    return dashboardData?.consents.current_consents.find(
      c => c.consent_type === consentType
    ) || null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'withdrawn':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderConsentManagement = () => {
    const consentTypes = [
      {
        type: 'data_processing',
        title: 'Data Processing',
        description: 'Allow processing of your personal data for core platform functionality'
      },
      {
        type: 'analytics',
        title: 'Analytics & Insights',
        description: 'Allow analysis of your data to generate insights and improve solutions'
      },
      {
        type: 'research',
        title: 'Research Participation',
        description: 'Allow anonymized use of your data for research and platform improvement'
      },
      {
        type: 'marketing',
        title: 'Marketing Communications',
        description: 'Receive personalized recommendations and platform updates'
      }
    ];

    return (
      <div className="space-y-4">
        {consentTypes.map((consent) => {
          const currentConsent = getConsentStatus(consent.type);
          const isGranted = currentConsent?.status === 'granted';
          
          return (
            <Card key={consent.type}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium">{consent.title}</h3>
                      {getStatusIcon(currentConsent?.status || 'withdrawn')}
                      <Badge variant={isGranted ? 'default' : 'secondary'}>
                        {isGranted ? 'Granted' : 'Withdrawn'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{consent.description}</p>
                    {currentConsent && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last updated: {new Date(currentConsent.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <Switch
                      checked={isGranted}
                      disabled={actionLoading === `consent-${consent.type}`}
                      onCheckedChange={(checked) => 
                        updateConsent(consent.type, checked, consent.description)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderDataUsage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Data Storage Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData?.data_usage.summary.total_records || 0}
              </div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dashboardData?.data_usage.summary.estimated_storage_mb?.toFixed(1) || '0.0'} MB
              </div>
              <div className="text-sm text-gray-600">Storage Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {dashboardData?.retention_policy.account_age_days || 0}
              </div>
              <div className="text-sm text-gray-600">Account Age (Days)</div>
            </div>
          </div>

          <div className="space-y-3">
            {dashboardData && Object.entries(dashboardData.data_usage)
              .filter(([key]) => key !== 'summary')
              .map(([collection, count]) => (
                <div key={collection} className="flex justify-between items-center">
                  <span className="capitalize">{collection.replace('_', ' ')}</span>
                  <Badge variant="outline">{count} records</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Data Retention Policy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData?.retention_policy.retention_periods && 
              Object.entries(dashboardData.retention_policy.retention_periods).map(([dataType, period]) => (
                <div key={dataType} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="capitalize font-medium">{dataType.replace('_', ' ')}</span>
                  <span className="text-sm text-gray-600">{period}</span>
                </div>
              ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Next data review: {dashboardData?.retention_policy.next_review_date ? 
                new Date(dashboardData.retention_policy.next_review_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataRequests = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Export Your Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Download all your personal data in a structured format (GDPR Article 20).
            </p>
            <Button 
              onClick={() => createDataRequest('export')}
              disabled={actionLoading === 'export'}
              className="w-full"
            >
              {actionLoading === 'export' ? 'Creating Request...' : 'Request Data Export'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Anonymize Your Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Convert your data to anonymous format for research while removing personal identifiers.
            </p>
            <Button 
              variant="outline"
              onClick={() => createDataRequest('anonymize')}
              disabled={actionLoading === 'anonymize'}
              className="w-full"
            >
              {actionLoading === 'anonymize' ? 'Creating Request...' : 'Request Anonymization'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span>Delete Your Account</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. All your data will be permanently deleted according to your selected retention policy.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Button 
              variant="destructive"
              onClick={() => createDataRequest('delete', 'complete')}
              disabled={actionLoading === 'delete'}
              className="w-full"
            >
              {actionLoading === 'delete' ? 'Creating Request...' : 'Request Complete Deletion'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => createDataRequest('delete', 'anonymize_retain')}
              disabled={actionLoading === 'delete'}
              className="w-full"
            >
              Delete Personal Data (Keep Anonymous Research Data)
            </Button>
          </div>
        </CardContent>
      </Card>

      {dashboardData?.data_requests && dashboardData.data_requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Request History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.data_requests.map((request) => (
                <div key={request.request_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="font-medium capitalize">{request.request_type} Request</div>
                      <div className="text-sm text-gray-600">
                        Created: {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      request.status === 'completed' ? 'default' :
                      request.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {request.status}
                    </Badge>
                    {request.status === 'completed' && request.request_type === 'export' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadExport(request.request_id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPrivacyRights = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Your Privacy Rights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData?.privacy_rights && Object.entries(dashboardData.privacy_rights).map(([right, description]) => (
              <div key={right} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium capitalize">{right.replace('_', ' ')}</div>
                  <div className="text-sm text-gray-600">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal Basis for Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p><strong>Consent:</strong> For analytics, research, and marketing communications</p>
            <p><strong>Contract:</strong> For core platform functionality and user account management</p>
            <p><strong>Legitimate Interest:</strong> For security, fraud prevention, and service improvement</p>
            <p><strong>Legal Obligation:</strong> For compliance with applicable laws and regulations</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading privacy dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <span>Privacy Center</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your privacy settings, data usage, and exercise your privacy rights
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="consents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consents">Consents</TabsTrigger>
          <TabsTrigger value="data-usage">Data Usage</TabsTrigger>
          <TabsTrigger value="requests">Data Requests</TabsTrigger>
          <TabsTrigger value="rights">Privacy Rights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="consents" className="mt-6">
          {renderConsentManagement()}
        </TabsContent>
        
        <TabsContent value="data-usage" className="mt-6">
          {renderDataUsage()}
        </TabsContent>
        
        <TabsContent value="requests" className="mt-6">
          {renderDataRequests()}
        </TabsContent>
        
        <TabsContent value="rights" className="mt-6">
          {renderPrivacyRights()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrivacyCenter;