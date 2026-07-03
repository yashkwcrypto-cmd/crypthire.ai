'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Loader2, FileText, Download, LogOut, Brain, Search, Filter, User, Mail, CheckCircle, XCircle, AlertCircle, TrendingUp, Calendar, ChevronDown, Bot, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface JobDescription {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
}

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  status: string;
  analysisResult?: string;
  createdAt: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [reportProgress, setReportProgress] = useState<number | null>(null);
  const [token, setToken] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [showJdManager, setShowJdManager] = useState(false);
  const [newJdTitle, setNewJdTitle] = useState('');
  const [newJdDescription, setNewJdDescription] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [expandedJds, setExpandedJds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '', linkedinUrl: '', portfolioUrl: '' });

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      fetchCandidates(savedToken);
      fetchJobDescriptions(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginForm, action: 'login' }),
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.data?.token;
        setToken(token);
        localStorage.setItem('admin_token', token);
        setIsAuthenticated(true);
        fetchCandidates(token);
        fetchJobDescriptions(token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    setIsAuthenticated(false);
    setCandidates([]);
    setJobDescriptions([]);
  };

  const fetchCandidates = async (authToken: string = token) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/candidates', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCandidates(data.data || []);
      } else {
        setError('Failed to fetch candidates');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDescriptions = async (authToken: string = token) => {
    try {
      const response = await fetch('/api/admin/jd', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setJobDescriptions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch job descriptions', error);
    }
  };

  const handleCreateJd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/jd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newJdTitle, description: newJdDescription }),
      });
      if (response.ok) {
        setNewJdTitle('');
        setNewJdDescription('');
        fetchJobDescriptions();
      }
    } catch (error) {
      console.error('Failed to create JD', error);
    }
  };

  const handleToggleJd = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/jd/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (response.ok) {
        fetchJobDescriptions();
      }
    } catch (error) {
      console.error('Failed to toggle JD status', error);
    }
  };

  const handleDeleteJd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job description?')) return;
    try {
      const response = await fetch(`/api/admin/jd/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchJobDescriptions();
        if (jobDescription === id) setJobDescription('');
      }
    } catch (error) {
      console.error('Failed to delete JD', error);
    }
  };

  const handleAnalyze = async (candidateId: string) => {
    setAnalyzingId(candidateId);
    try {
      const selectedJd = jobDescriptions.find(jd => jd.id === jobDescription);
      let jdText: string | undefined = selectedJd ? selectedJd.description : jobDescription; 

      if (!jdText && jobDescriptions.length > 0) {
        jdText = "AVAILABLE JOB DESCRIPTIONS (Choose the most suitable one for this candidate and evaluate them against it):\n\n" + 
                 jobDescriptions.filter(jd => jd.isActive)
                               .map(jd => `=== Title: ${jd.title} ===\n${jd.description}`)
                               .join('\n\n');
      }

      const response = await fetch('/api/admin/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ candidateId, jobDescription: jdText }),
      });

      if (response.ok) {
        fetchCandidates();
      } else {
        setError('Analysis failed');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleStatusUpdate = async (candidateId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchCandidates();
      } else {
        setError('Status update failed');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('Are you sure you want to delete this candidate? This cannot be undone.')) return;
    try {
      const response = await fetch(`/api/admin/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setCandidates(candidates.filter(c => c.id !== candidateId));
        if (selectedCandidate?.id === candidateId) setSelectedCandidate(null);
      } else {
        setError('Failed to delete candidate');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;
    try {
      const response = await fetch(`/api/admin/candidates/${editingCandidate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updated = await response.json();
        setCandidates(candidates.map(c => c.id === editingCandidate.id ? updated.data : c));
        if (selectedCandidate?.id === editingCandidate.id) setSelectedCandidate(updated.data);
        setEditingCandidate(null);
      } else {
        setError('Failed to update candidate details');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await fetch('/api/admin/report?format=csv', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'candidates-report.csv';
        a.click();
      } else {
        setError('Report download failed');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleRunDailyReport = async () => {
    try {
      setReportProgress(0);
      
      const interval = setInterval(() => {
        setReportProgress(prev => {
          if (prev === null) return null;
          const increment = Math.floor(Math.random() * 5) + 2;
          return prev >= 90 ? 90 : prev + increment;
        });
      }, 800);

      const response = await fetch('/api/admin/trigger-report', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      clearInterval(interval);
      setReportProgress(100);

      setTimeout(() => {
        setReportProgress(null);
        if (response.ok) {
          alert(data.message || 'Daily report triggered and sent to HR!');
          fetchCandidates(); // Refresh to show any new AI analysis
        } else {
          alert(`Failed: ${data.error}`);
        }
      }, 600);
      
    } catch (error) {
      setReportProgress(null);
      console.error('Error triggering daily report:', error);
      alert('Network error. Failed to trigger report.');
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    
    let matchesDate = true;
    const candidateDate = new Date(candidate.createdAt);
    if (startDate) {
      matchesDate = matchesDate && candidateDate >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && candidateDate <= end;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-yellow-400 border-yellow-500/50 bg-yellow-500/10">Pending</Badge>;
      case 'reviewing': return <Badge variant="outline" className="text-blue-400 border-blue-500/50 bg-blue-500/10">Reviewing</Badge>;
      case 'interviewed': return <Badge variant="outline" className="text-primary border-primary/50 bg-primary/10">Interviewed</Badge>;
      case 'hired': return <Badge variant="outline" className="text-green-400 border-green-500/50 bg-green-500/10">Hired</Badge>;
      case 'rejected': return <Badge variant="outline" className="text-destructive border-destructive/50 bg-destructive/10">Rejected</Badge>;
      default: return <Badge variant="outline" className="text-gray-400 border-gray-500/50 bg-gray-500/10">Unknown</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
        {/* Animated Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-blob pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full mix-blend-screen animate-blob animation-delay-2000 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md z-10 px-6"
        >
          <Card className="border-border bg-card text-card-foreground backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner shadow-primary/20">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">Admin Portal</CardTitle>
              <CardDescription>Sign in to manage candidates & AI insights</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                    placeholder="admin@crypthire.ai"
                    className="bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-2 py-6 shadow-lg shadow-primary/20 text-base font-semibold group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      'Secure Login'
                    )}
                  </span>
                  {!loading && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to Home
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col overflow-x-hidden">
      {reportProgress !== null && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-full max-w-sm bg-card/90 border-primary/20 shadow-2xl shadow-primary/10">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-muted stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent" />
                  <circle 
                    className="text-primary stroke-current transition-all duration-300 ease-out" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    cx="50" cy="50" r="40" 
                    fill="transparent" 
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - reportProgress / 100)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-primary">
                  {reportProgress}%
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Generating Report</h3>
                <p className="text-sm text-muted-foreground animate-pulse">
                  {reportProgress < 30 ? 'Analyzing missed candidates...' : 
                   reportProgress < 70 ? 'Compiling PDF document...' : 
                   reportProgress < 100 ? 'Preparing email for HR...' : 
                   'Report Sent!'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Animated Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-blob pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full mix-blend-screen animate-blob animation-delay-2000 pointer-events-none" />

      <nav className="border-b border-border bg-background/80 text-foreground backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            CryptHire Admin
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary">
              <Link href="/portal/apply">
                <User className="w-4 h-4 mr-2" /> Application Portal
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-6 py-10 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Recruitment Pipeline</h1>
            <p className="text-muted-foreground">Manage AI-driven candidate insights and hiring workflow.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRunDailyReport} variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
              <Mail className="w-4 h-4 mr-2" />
              Trigger Daily Report
            </Button>
            <Button onClick={handleDownloadReport} className="shadow-lg shadow-primary/20 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
              <Download className="w-4 h-4 mr-2" />
              Export AI Report
            </Button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row gap-4 items-stretch"
        >
          <Card className="border-border bg-card text-card-foreground backdrop-blur-xl shadow-2xl flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Active Job Requirements
              </CardTitle>
              <CardDescription>Select a job description to use for AI candidate evaluation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <select
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full appearance-none bg-muted/50 border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:bg-muted"
                  >
                    <option value="" className="bg-background">-- Select a Job Description --</option>
                    {jobDescriptions.filter(jd => jd.isActive).map(jd => (
                      <option key={jd.id} value={jd.id} className="bg-background">{jd.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                <Button 
                  onClick={() => setShowJdManager(true)}
                  variant="outline" 
                  className="border-primary/30 text-primary hover:bg-primary/10 whitespace-nowrap h-12 px-6"
                >
                  Manage JDs
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-border bg-card text-card-foreground backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-muted/50 border-border w-full focus-visible:ring-primary focus-visible:border-primary transition-all"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-muted/50 border-border text-sm h-10"
                      title="Start Date"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-muted/50 border-border text-sm h-10"
                      title="End Date"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="text-muted-foreground w-4 h-4" />
                    <div className="relative w-full md:w-48">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full appearance-none bg-muted/50 border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all h-10"
                      >
                        <option value="all" className="bg-background">All Statuses</option>
                        <option value="pending" className="bg-background">Pending</option>
                        <option value="reviewing" className="bg-background">Reviewing</option>
                        <option value="interviewed" className="bg-background">Interviewed</option>
                        <option value="hired" className="bg-background">Hired</option>
                        <option value="rejected" className="bg-background">Rejected</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                  <TableRow>
                    <TableHead className="font-semibold text-foreground py-4 px-6">Candidate Details</TableHead>
                    <TableHead className="font-semibold text-foreground py-4">Status</TableHead>
                    <TableHead className="font-semibold text-foreground py-4">AI Score</TableHead>
                    <TableHead className="font-semibold text-foreground py-4">Submitted On</TableHead>
                    <TableHead className="font-semibold text-foreground py-4 text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCandidates.map((candidate, index) => {
                    let score = '-';
                    let scoreColor = 'text-muted-foreground';
                    let analysis: any = null;
                    if (candidate.analysisResult) {
                      try {
                        analysis = JSON.parse(candidate.analysisResult);
                        if (analysis.score) {
                          score = `${analysis.score}/100`;
                          scoreColor = analysis.score >= 80 ? 'text-green-400 font-bold' : 
                                      analysis.score >= 60 ? 'text-yellow-400 font-medium' : 'text-red-400 font-medium';
                        }
                      } catch (e) {}
                    }

                    return (
                      <TableRow key={candidate.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="text-foreground font-medium mb-1">{candidate.fullName}</div>
                              <div className="text-muted-foreground text-xs flex items-center gap-1.5">
                                <Mail className="w-3 h-3" /> {candidate.email}
                              </div>
                              {analysis && analysis.currentCompany && (
                                <div className="text-muted-foreground text-xs flex items-center gap-1.5 mt-1">
                                  <FileText className="w-3 h-3" /> {analysis.currentCompany}
                                </div>
                              )}
                              {analysis && analysis.location && (
                                <div className="text-muted-foreground text-xs flex items-center gap-1.5 mt-1">
                                  <AlertCircle className="w-3 h-3 opacity-50" /> {analysis.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(candidate.status)}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1.5 ${scoreColor}`}>
                            {score !== '-' && <TrendingUp className="w-4 h-4" />}
                            {score}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(candidate.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAnalyze(candidate.id)}
                              disabled={analyzingId === candidate.id}
                              className="border-primary/30 text-primary hover:bg-primary/10"
                            >
                              {analyzingId === candidate.id ? (
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              ) : (
                                <Brain className="w-3 h-3 mr-2" />
                              )}
                              {analyzingId === candidate.id ? 'Analyzing' : 'AI Analysis'}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCandidate(candidate)}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              Details
                            </Button>
                            
                            <div className="relative w-32">
                              <select
                                value={candidate.status}
                                onChange={(e) => handleStatusUpdate(candidate.id, e.target.value)}
                                className="w-full appearance-none bg-muted/50 border border-border text-xs rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9 transition-all cursor-pointer hover:bg-muted"
                              >
                                <option value="pending" className="bg-background">Pending</option>
                                <option value="reviewing" className="bg-background">Reviewing</option>
                                <option value="interviewed" className="bg-background">Interviewed</option>
                                <option value="hired" className="bg-background">Hired</option>
                                <option value="rejected" className="bg-background">Rejected</option>
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingCandidate(candidate);
                                setEditForm({
                                  fullName: candidate.fullName,
                                  email: candidate.email,
                                  phone: candidate.phone || '',
                                  linkedinUrl: candidate.linkedinUrl || '',
                                  portfolioUrl: candidate.portfolioUrl || '',
                                });
                              }}
                              className="text-blue-400 hover:text-blue-500 hover:bg-blue-500/10"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCandidate(candidate.id)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredCandidates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20">
                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                          <FileText className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">No candidates found</h3>
                        <p className="text-muted-foreground">Adjust your search or status filters to find candidates.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {totalPages > 1 && (
              <CardFooter className="py-4 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCandidates.length)} of {filteredCandidates.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-border hover:bg-muted/50"
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-medium px-4">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="border-border hover:bg-muted/50"
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </motion.div>

        {/* JD Manager Modal */}
        {showJdManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50 shrink-0">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" /> Manage Job Descriptions
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowJdManager(false)}>
                  <XCircle className="w-6 h-6" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Create New JD */}
                <div className="p-6 border-r border-border w-full md:w-1/3 bg-background/80 text-foreground flex flex-col shrink-0 overflow-y-auto">
                  <h3 className="font-semibold mb-4 text-lg">Create New</h3>
                  <form onSubmit={handleCreateJd} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        value={newJdTitle}
                        onChange={(e) => setNewJdTitle(e.target.value)}
                        placeholder="e.g., Senior Frontend Developer"
                        className="bg-muted/50 border-border focus-visible:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Full Requirements (Job Description)</Label>
                      <textarea
                        value={newJdDescription}
                        onChange={(e) => setNewJdDescription(e.target.value)}
                        placeholder="Paste full job description, requirements, and responsibilities here..."
                        className="w-full h-48 bg-muted/50 border border-border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full shadow-lg shadow-primary/20">Save Job Description</Button>
                  </form>
                </div>

                {/* List JDs */}
                <div className="p-6 w-full md:w-2/3 overflow-y-auto custom-scrollbar">
                  <h3 className="font-semibold mb-4 text-lg">Saved Descriptions</h3>
                  <div className="space-y-4">
                    {jobDescriptions.map(jd => (
                      <Card key={jd.id} className={`bg-muted/50 border ${jd.isActive ? 'border-primary/50' : 'border-border'}`}>
                        <CardHeader className="py-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <CardTitle className="text-lg">{jd.title}</CardTitle>
                              <div className={`text-xs text-muted-foreground mt-1 whitespace-pre-wrap ${!expandedJds.has(jd.id) ? 'line-clamp-2' : ''}`}>
                                {jd.description}
                              </div>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 mt-2 text-xs text-primary" 
                                onClick={() => {
                                  const newSet = new Set(expandedJds);
                                  if (newSet.has(jd.id)) newSet.delete(jd.id);
                                  else newSet.add(jd.id);
                                  setExpandedJds(newSet);
                                }}
                              >
                                {expandedJds.has(jd.id) ? 'Show Less' : 'View Full JD'}
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className={jd.isActive ? 'text-green-400 border-green-500/50 bg-green-500/10' : 'text-gray-400'}>
                                {jd.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleJd(jd.id, jd.isActive)}
                                className={jd.isActive ? 'text-yellow-400 hover:text-yellow-500 hover:bg-yellow-500/10' : 'text-green-400 hover:text-green-500 hover:bg-green-500/10'}
                              >
                                {jd.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteJd(jd.id)}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                    {jobDescriptions.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        No job descriptions saved yet. Create one!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Candidate Details Modal */}
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
                <div>
                  <h2 className="text-2xl font-bold">{selectedCandidate.fullName}</h2>
                  <p className="text-muted-foreground">{selectedCandidate.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {selectedCandidate.linkedinUrl && (
                      <a href={selectedCandidate.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs bg-blue-500/20 text-blue-300 hover:text-blue-100 hover:bg-blue-500/40 px-2 py-1 rounded transition-colors flex items-center gap-1">
                        LinkedIn
                      </a>
                    )}
                    {selectedCandidate.portfolioUrl && (
                      <a href={selectedCandidate.portfolioUrl} target="_blank" rel="noreferrer" className="text-xs bg-purple-500/20 text-purple-300 hover:text-purple-100 hover:bg-purple-500/40 px-2 py-1 rounded transition-colors flex items-center gap-1">
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCandidate(null)}>
                  <XCircle className="w-6 h-6" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                {selectedCandidate.analysisResult ? (() => {
                  try {
                    const analysis = JSON.parse(selectedCandidate.analysisResult);
                    return (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-muted/50 border-border">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                              <div className="text-sm text-muted-foreground mb-1">AI Score</div>
                              <div className={`text-4xl font-bold ${analysis.score >= 80 ? 'text-green-400' : analysis.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {analysis.score}
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-muted/50 border-border md:col-span-2">
                            <CardContent className="p-4">
                              <div className="text-sm text-muted-foreground mb-1">Current Role & Experience</div>
                              <div className="font-medium text-lg">{analysis.currentRole || 'Not specified'}</div>
                              <div className="text-muted-foreground">{analysis.experience || 'Experience not specified'}</div>
                              {analysis.location && (
                                <div className="text-muted-foreground mt-2 text-sm">📍 {analysis.location}</div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                        
                        {analysis.education && (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <span className="w-5 h-5 flex items-center justify-center text-primary">🎓</span> Education
                            </h3>
                            <div className="bg-muted/50 p-4 rounded-lg border border-border">
                              {analysis.education}
                            </div>
                          </div>
                        )}
                        
                        {(analysis.currentCompany || (analysis.previousCompanies && analysis.previousCompanies.length > 0)) && (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <User className="w-5 h-5 text-primary" /> Work History
                            </h3>
                            <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3">
                              {analysis.currentCompany && (
                                <div>
                                  <span className="text-muted-foreground text-sm">Current Company:</span>
                                  <div className="font-medium">{analysis.currentCompany}</div>
                                </div>
                              )}
                              {analysis.previousCompanies && analysis.previousCompanies.length > 0 && (
                                <div>
                                  <span className="text-muted-foreground text-sm">Previous Companies:</span>
                                  <div className="font-medium text-sm text-muted-foreground">
                                    {analysis.previousCompanies.join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" /> Summary
                          </h3>
                          <p className="text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-lg border border-border">{analysis.summary}</p>
                        </div>

                        {analysis.recommendedJd && (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <Brain className="w-5 h-5 text-purple-400" /> AI Recommended Role
                            </h3>
                            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg font-medium text-purple-200">
                              {analysis.recommendedJd}
                            </div>
                          </div>
                        )}

                        {analysis.requirementsMatch && (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-blue-400" /> Job Requirements Match
                            </h3>
                            <p className="text-muted-foreground leading-relaxed bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">{analysis.requirementsMatch}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" /> Plus Points
                            </h3>
                            <ul className="space-y-2">
                              {(analysis.strengths || []).map((s: string, i: number) => (
                                <li key={i} className="text-sm bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-500/20 p-2 rounded text-green-900 dark:text-green-100 flex items-start gap-2">
                                  <span className="text-green-500 dark:text-green-400 mt-0.5">•</span> {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                              <AlertCircle className="w-4 h-4" /> Minus Points
                            </h3>
                            <ul className="space-y-2">
                              {(analysis.weaknesses || []).map((w: string, i: number) => (
                                <li key={i} className="text-sm bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-500/20 p-2 rounded text-yellow-900 dark:text-yellow-100 flex items-start gap-2">
                                  <span className="text-yellow-500 dark:text-yellow-400 mt-0.5">•</span> {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {(analysis.issues && analysis.issues.length > 0) && (
                          <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                              <XCircle className="w-4 h-4" /> Red Flags / Issues
                            </h3>
                            <ul className="space-y-2">
                              {analysis.issues.map((issue: string, i: number) => (
                                <li key={i} className="text-sm bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-500/20 p-3 rounded text-red-900 dark:text-red-100 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Brain className="w-5 h-5 text-primary" /> Recommendation
                          </h3>
                          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg font-medium">
                            {analysis.recommendation}
                          </div>
                        </div>
                      </div>
                    );
                  } catch (e) {
                    return <div className="text-red-400 p-4 bg-red-500/10 rounded-lg">Failed to parse analysis results.</div>;
                  }
                })() : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Brain className="w-12 h-12 mb-4 opacity-50" />
                    <p>No AI analysis available for this candidate.</p>
                    <p className="text-sm mt-2">Click "AI Analysis" to generate a report.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Candidate Modal */}
        {editingCandidate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50 shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-400" /> Edit Candidate
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setEditingCandidate(null)}>
                  <XCircle className="w-6 h-6" />
                </Button>
              </div>
              <form onSubmit={handleSaveCandidate} className="p-6 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={editForm.fullName} 
                    onChange={e => setEditForm({...editForm, fullName: e.target.value})} 
                    required 
                    className="bg-muted/50 border-border focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    value={editForm.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})} 
                    required 
                    className="bg-muted/50 border-border focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    value={editForm.phone} 
                    onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                    className="bg-muted/50 border-border focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input 
                    type="url" 
                    value={editForm.linkedinUrl} 
                    onChange={e => setEditForm({...editForm, linkedinUrl: e.target.value})} 
                    className="bg-muted/50 border-border focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Portfolio URL</Label>
                  <Input 
                    type="url" 
                    value={editForm.portfolioUrl} 
                    onChange={e => setEditForm({...editForm, portfolioUrl: e.target.value})} 
                    className="bg-muted/50 border-border focus-visible:ring-primary"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setEditingCandidate(null)}>Cancel</Button>
                  <Button type="submit" className="shadow-lg shadow-primary/20">Save Changes</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
