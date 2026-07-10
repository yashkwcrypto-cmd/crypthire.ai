'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ApplyPage() {
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', linkedinUrl: '', portfolioUrl: '' });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus('error');
      setMessage('Please upload your resume (PDF only)');
      return;
    }

    setLoading(true);
    setStatus('idle');
    const data = new FormData();
    data.append('fullName', formData.fullName);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('linkedinUrl', formData.linkedinUrl);
    data.append('portfolioUrl', formData.portfolioUrl);
    data.append('resume', file);

    try {
      const response = await fetch('/api/candidate', { method: 'POST', body: data });
      const result = await response.json();
      if (response.ok) {
        setStatus('success');
        setMessage('Application submitted successfully! Our AI is now analyzing your profile.');
        setFormData({ fullName: '', email: '', phone: '', linkedinUrl: '', portfolioUrl: '' });
        setFile(null);
      } else {
        setStatus('error');
        setMessage(result.error || 'Submission failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col overflow-hidden w-full">
      {/* Animated Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-blob pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full mix-blend-screen animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-500/20 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-4000 pointer-events-none" />

      <nav className="border-b border-border bg-background/80 text-foreground backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            CryptHire Application
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hover:bg-primary/10 hover:text-primary">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-6 py-12 z-10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-xl"
        >
          <Card className="border-border bg-card text-card-foreground backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-foreground font-medium animate-pulse">Processing your application...</p>
              </div>
            )}
            
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner shadow-primary/20">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Join Our Team</CardTitle>
              <CardDescription className="text-base mt-2">Submit your resume and let our AI match you with the perfect role.</CardDescription>
            </CardHeader>
            
            <CardContent>
              <AnimatePresence mode="wait">
                {status !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
                      status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-destructive/10 border-destructive/20 text-destructive'
                    }`}
                  >
                    {status === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                    <div className="text-sm font-medium">{message}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name (Optional)</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Jane Doe"
                    className="bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL (Optional)</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      value={formData.linkedinUrl || ''}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/janedoe"
                      className="bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolioUrl">Portfolio URL (Optional)</Label>
                    <Input
                      id="portfolioUrl"
                      type="url"
                      value={formData.portfolioUrl || ''}
                      onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                      placeholder="https://janedoe.com"
                      className="bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                    />
                  </div>
                </div>

                <Separator className="bg-muted my-6" />

                <div className="space-y-2">
                  <Label>Resume (PDF)</Label>
                  <div 
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center group ${
                      dragActive ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-white/20 bg-muted/50 hover:border-primary/50 hover:bg-muted'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        if (e.dataTransfer.files[0].type === 'application/pdf') {
                          setFile(e.dataTransfer.files[0]);
                        } else {
                          setStatus('error');
                          setMessage('Only PDF files are allowed.');
                        }
                      }
                    }}
                  >
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const selected = e.target.files?.[0];
                        if (selected) {
                          if (selected.type !== 'application/pdf') {
                            setStatus('error');
                            setMessage('Only PDF files are allowed.');
                            return;
                          }
                          setFile(selected);
                          setStatus('idle');
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                      {file ? (
                        <>
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <div className="text-sm font-medium text-primary">Selected: {file.name}</div>
                          <div className="text-xs text-muted-foreground">Click or drag to replace</div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-primary font-medium">Click to upload</span> or drag and drop
                          </div>
                          <div className="text-xs text-muted-foreground">PDF files only (max. 5MB)</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 mt-6 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Submit Application
                    <FileText className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  {/* Button shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
