import Link from 'next/link'
import { Code2, QrCode, Users, LayoutDashboard, Zap, Shield, Clock, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section with Grid Background */}
      <div className="relative overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="relative">
          {/* Header */}
          <header className="border-b border-border/40 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                    <Code2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Codered 3.0</h1>
                    <p className="text-xs text-muted-foreground">by E-Cell BMSIT</p>
                  </div>
                </div>
                <nav className="hidden md:flex items-center gap-6">
                  <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                  <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                  <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </Link>
                  <Link href="/login">
                    <Button size="sm">Login</Button>
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          {/* Hero Content */}
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
                <Zap className="w-4 h-4" />
                <span>Next-Gen Hackathon Management</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-balance">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Codered 3.0
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground text-balance max-w-2xl mx-auto">
                Powered by E-Cell BMSIT. A complete hackathon management platform with QR-based resource tracking, real-time dashboards, and seamless team coordination.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="text-base px-8">
                    Get Started
                    <Zap className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-base px-8">
                  Learn More
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12">
                <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Participants</div>
                </Card>
                <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                  <div className="text-3xl font-bold text-accent">48hrs</div>
                  <div className="text-sm text-muted-foreground">Non-Stop</div>
                </Card>
                <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                  <div className="text-3xl font-bold text-primary">100+</div>
                  <div className="text-sm text-muted-foreground">Projects</div>
                </Card>
                <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                  <div className="text-3xl font-bold text-accent">₹5L</div>
                  <div className="text-sm text-muted-foreground">Prize Pool</div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid Section */}
      <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">
              Powerful Features for{' '}
              <span className="text-primary">Modern Hackathons</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Everything you need to manage a successful hackathon, from QR-based tracking to real-time analytics
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* QR Code System */}
            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all group">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">QR Code System</h3>
              <p className="text-muted-foreground leading-relaxed">
                Unique QR codes for every participant. Scan for food, sleeping bags, chill room access, and help requests.
              </p>
            </Card>

            {/* Admin Dashboard */}
            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 hover:border-accent/50 transition-all group">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 text-accent mb-6 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Admin Dashboard</h3>
              <p className="text-muted-foreground leading-relaxed">
                Complete control panel with real-time stats, participant management, announcements, and CSV exports.
              </p>
            </Card>

            {/* Team Portal */}
            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all group">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Team Portal</h3>
              <p className="text-muted-foreground leading-relaxed">
                Teams can track food status, sleeping bags, view announcements, and monitor their GitHub repo status.
              </p>
            </Card>

            {/* Role-Based Access */}
            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 hover:border-accent/50 transition-all group">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 text-accent mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Role-Based Access</h3>
              <p className="text-muted-foreground leading-relaxed">
                Secure JWT authentication with three roles: Admin, Volunteer, and Team with protected routes.
              </p>
            </Card>

            {/* Real-Time Tracking */}
            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all group">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-Time Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Live updates for food counters, sleeping bag status, chill room occupancy, and help requests.
              </p>
            </Card>

            {/* GitHub Integration */}
            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 hover:border-accent/50 transition-all group">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 text-accent mb-6 group-hover:scale-110 transition-transform">
                <Github className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">GitHub Integration</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automatic GitHub repo status tracking for all teams with commit history and activity monitoring.
              </p>
            </Card>
          </div>

          {/* Tech Stack Showcase */}
          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <div className="text-center space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold">Built with Modern Tech Stack</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Powered by MERN stack (MongoDB, Express.js, React, Node.js) with JWT authentication and real-time capabilities
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                {['MongoDB', 'Express.js', 'React', 'Node.js', 'JWT', 'TailwindCSS'].map((tech) => (
                  <div key={tech} className="px-6 py-3 rounded-full bg-background/50 backdrop-blur border border-border/50 text-sm font-medium">
                    {tech}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="container mx-auto px-4 relative">
          <Card className="max-w-4xl mx-auto p-12 md:p-16 text-center bg-card/80 backdrop-blur border-border/50">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
              Ready to Experience{' '}
              <span className="text-primary">Codered 3.0</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Join hundreds of innovators at E-Cell BMSIT's flagship hackathon. Build, learn, and compete with the best.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="text-base px-8">
                  Register Now
                  <Zap className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-base px-8">
                View Dashboard Demo
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                  <Code2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold">Codered 3.0</h3>
                  <p className="text-xs text-muted-foreground">by E-Cell BMSIT</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Next-generation hackathon management platform
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About E-Cell</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Past Events</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Twitter</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">LinkedIn</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Instagram</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>© 2025 Codered 3.0 by E-Cell BMSIT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
