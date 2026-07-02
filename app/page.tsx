'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Zap, FileText, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-8 h-8 text-primary" />
            CryptHire <span className="text-primary">AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hover:bg-primary/10 hover:text-primary">
              <Link href="/portal/apply">Apply Now</Link>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/20">
              <Link href="/portal/admin">Admin Portal</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-6 py-20 z-10 flex flex-col justify-center">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" /> Next-Generation Recruitment
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500"
          >
            Hire the Future, <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              Powered by AI.
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Streamline your hiring process with intelligent resume analysis, automated candidate evaluation, and data-driven insights.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="h-14 px-8 text-lg shadow-xl shadow-primary/20 group w-full sm:w-auto">
              <Link href="/portal/apply">
                Submit Resume
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg border-white/10 hover:bg-white/5 w-full sm:w-auto">
              <Link href="/portal/admin">
                Access Dashboard
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div 
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants}>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-colors h-full">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/30">
                  <Bot className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">AI Analysis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Advanced AI algorithms instantly parse and analyze resumes to identify the most qualified candidates for your roles.
                </p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center text-sm text-gray-300 gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Semantic Matching</li>
                  <li className="flex items-center text-sm text-gray-300 gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Skill Extraction</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-colors h-full">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
                  <Zap className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Lightning Fast</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Reduce time-to-hire from weeks to days with automated screening and instant candidate scoring.
                </p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center text-sm text-gray-300 gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Real-time Processing</li>
                  <li className="flex items-center text-sm text-gray-300 gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Automated Pipelines</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-colors h-full">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30">
                  <FileText className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Detailed Insights</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate comprehensive analysis reports with objective skills assessments and actionable hiring recommendations.
                </p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center text-sm text-gray-300 gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Objective Scoring</li>
                  <li className="flex items-center text-sm text-gray-300 gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Exportable Reports</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
      
      <footer className="border-t border-white/5 bg-black/20 mt-20">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CryptHire AI. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
