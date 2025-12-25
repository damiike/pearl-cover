import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  Shield,
  Search,
  Camera,
  FileText,
  History,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Aged Care Tracking",
    description: "Monitor funding balances, track expenses, and manage allocations for Support at Home and Home Care Packages.",
    color: "text-emerald-500",
  },
  {
    icon: Shield,
    title: "WorkCover Claims",
    description: "Track medical expenses, monitor reimbursements, and see exactly what's covered and what's out-of-pocket.",
    color: "text-amber-500",
  },
  {
    icon: Camera,
    title: "Receipt Capture",
    description: "Snap photos of receipts directly from your phone. Never lose a receipt again.",
    color: "text-blue-500",
  },
  {
    icon: Search,
    title: "AI-Powered Search",
    description: "Find any invoice, claim, or note using natural language. Just ask what you're looking for.",
    color: "text-purple-500",
  },
  {
    icon: FileText,
    title: "Gmail-Style Notes",
    description: "Organize communications and notes with categories and tags, just like your email inbox.",
    color: "text-pink-500",
  },
  {
    icon: History,
    title: "Audit Trail",
    description: "Complete transparency with a full log of who changed what and when.",
    color: "text-cyan-500",
  },
];

const benefits = [
  "Track aged care funding and WorkCover in one place",
  "Link multiple expenses to single payments",
  "Never lose a receipt with digital storage",
  "Understand exactly what's paid vs pending",
  "Track the 'gap' between charges and reimbursements",
  "Share access with family members transparently",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto flex items-center justify-between py-6 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Pearl Cover
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Aged Care & WorkCover
            </span>
            <br />
            Expense Tracking Made Simple
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop drowning in paper receipts. Track funding, manage claims, and reconcile payments
            all in one place. Built for Australian families managing care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/register">
                Start Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Stay Organized
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Designed specifically for managing aged care funding and WorkCover claims in Australia.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 mb-4 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white max-w-4xl mx-auto">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 py-10">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                Ready to get organized?
              </h3>
              <p className="text-indigo-100">
                Start tracking your expenses today. It&apos;s free to get started.
              </p>
            </div>
            <Button size="lg" variant="secondary" className="shrink-0" asChild>
              <Link href="/register">
                Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">Pearl Cover</span>
          </div>
          <p>
            Built with care for Australian families managing aged care and WorkCover.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Pearl Cover. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
