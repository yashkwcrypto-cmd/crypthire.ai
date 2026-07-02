'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, FileText, Download, LogOut, Brain, Search, Filter, User, Mail, CheckCircle, XCircle, AlertCircle, TrendingUp, Calendar, ChevronDown, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
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
  const [token, setToken] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
        setToken(data.token);
        setIsAuthenticated(true);
        fetchCandidates(data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
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

  const handleAnalyze = async (candidateId: string) => {
    setAnalyzingId(candidateId);
    try {
      const response = await fetch('/api/admin/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ candidateId }),
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

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
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
                    className="bg-white/5 border-white/10 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
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
                    className="bg-white/5 border-white/10 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
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
      {/* Animated Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-blob pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full mix-blend-screen animate-blob animation-delay-2000 pointer-events-none" />

      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            CryptHire Admin
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary">
              <Link href="/portal/apply">
                <User className="w-4 h-4 mr-2" /> Application Portal
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsAuthenticated(false)}>
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
          <Button onClick={handleDownloadReport} className="shadow-lg shadow-primary/20 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
            <Download className="w-4 h-4 mr-2" />
            Export AI Report
          </Button>
        </div>

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
          <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 w-full focus-visible:ring-primary focus-visible:border-primary transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter className="text-muted-foreground w-4 h-4" />
                  <div className="relative w-full md:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full appearance-none bg-white/5 border border-white/10 text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
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
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5 hover:bg-white/5 border-b border-white/10">
                  <TableRow>
                    <TableHead className="font-semibold text-foreground py-4 px-6">Candidate Details</TableHead>
                    <TableHead className="font-semibold text-foreground py-4">Status</TableHead>
                    <TableHead className="font-semibold text-foreground py-4">AI Score</TableHead>
                    <TableHead className="font-semibold text-foreground py-4">Submitted On</TableHead>
                    <TableHead className="font-semibold text-foreground py-4 text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate, index) => {
                    let score = '-';
                    let scoreColor = 'text-muted-foreground';
                    if (candidate.analysisResult) {
                      try {
                        const analysis = JSON.parse(candidate.analysisResult);
                        if (analysis.score) {
                          score = `${analysis.score}/100`;
                          scoreColor = analysis.score >= 80 ? 'text-green-400 font-bold' : 
                                      analysis.score >= 60 ? 'text-yellow-400 font-medium' : 'text-red-400 font-medium';
                        }
                      } catch (e) {}
                    }

                    return (
                      <TableRow key={candidate.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="text-foreground font-medium mb-1">{candidate.fullName}</div>
                              <div className="text-muted-foreground text-xs flex items-center gap-1.5">
                                <Mail className="w-3 h-3" /> {candidate.email}
                              </div>
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
                            
                            <div className="relative w-32">
                              <select
                                value={candidate.status}
                                onChange={(e) => handleStatusUpdate(candidate.id, e.target.value)}
                                className="w-full appearance-none bg-white/5 border border-white/10 text-xs rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9 transition-all cursor-pointer hover:bg-white/10"
                              >
                                <option value="pending" className="bg-background">Pending</option>
                                <option value="reviewing" className="bg-background">Reviewing</option>
                                <option value="interviewed" className="bg-background">Interviewed</option>
                                <option value="hired" className="bg-background">Hired</option>
                                <option value="rejected" className="bg-background">Rejected</option>
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredCandidates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
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
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
