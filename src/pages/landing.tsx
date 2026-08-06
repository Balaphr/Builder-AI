import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sparkles, Zap, Globe, Shield, Palette, BarChart3, ArrowRight, Check } from 'lucide-react'

const features = [
  { icon: Sparkles, title: 'AI-Powered', description: 'Generate entire websites with a single prompt' },
  { icon: Palette, title: 'Drag & Drop', description: 'Intuitive visual builder with 20+ components' },
  { icon: Globe, title: 'Custom Domains', description: 'Publish to your own domain with free SSL' },
  { icon: Shield, title: 'Enterprise Security', description: 'SOC2 compliant with end-to-end encryption' },
  { icon: BarChart3, title: 'Analytics', description: 'Real-time visitor insights and conversion tracking' },
  { icon: Zap, title: 'Lightning Fast', description: 'CDN-powered with 95+ Lighthouse scores' },
]

const plans = [
  { name: 'Free', price: '$0', features: ['3 websites', '100 AI credits', '1GB storage', 'Subdomain hosting'] },
  { name: 'Pro', price: '$19', popular: true, features: ['25 websites', '1000 AI credits', '50GB storage', 'Custom domains', 'All templates'] },
  { name: 'Business', price: '$49', features: ['100 websites', '5000 AI credits', '200GB storage', 'Team collaboration', 'Automation'] },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">AI Builder</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#templates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Templates</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gradient-bg text-white">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Website Builder
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Build Websites with
            <br />
            <span className="gradient-text">Artificial Intelligence</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Create stunning, professional websites in minutes. Just describe what you want,
            and our AI builds it for you — no coding required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="xl" className="gradient-bg text-white group">
                Start Building Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="xl" variant="outline">
              Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 mx-auto max-w-5xl"
        >
          <div className="relative rounded-2xl overflow-hidden glass p-2">
            <div className="bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-xl p-8">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-6 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl gradient-bg flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-muted-foreground">AI Website Builder Preview</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
          <p className="text-xl text-muted-foreground">Powerful features to build any website</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-xl glass hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg gradient-bg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple pricing</h2>
          <p className="text-xl text-muted-foreground">Start free, scale as you grow</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-2xl ${plan.popular ? 'gradient-bg text-white ring-2 ring-primary' : 'glass'}`}
            >
              {plan.popular && <div className="text-sm font-medium mb-2 opacity-90">Most Popular</div>}
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="opacity-70">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button
                  className={`w-full ${plan.popular ? 'bg-white text-indigo-600 hover:bg-gray-100' : 'gradient-bg text-white'}`}
                >
                  Get Started
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 AI Website Builder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
