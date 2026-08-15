import React from "react";
import Logo from "@/components/Logo";
import { Star } from "lucide-react";

const proof = [
  { n: "Sarah J.", r: "VP Marketing", t: "Our conversion jumped 34% after adding the wall of love." },
  { n: "Marcus L.", r: "Founder", t: "Customers record a video in one click. Zero friction." },
  { n: "Elena R.", r: "Creative Dir.", t: "The embed widgets look stunning and match our brand." },
];

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-10">
        <div className="max-w-md w-full mx-auto">
          <Logo className="mb-10" />
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tighter mb-2">{title}</h1>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
      <div className="hidden lg:flex relative overflow-hidden bg-secondary/40 grain items-center justify-center p-16">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative z-10 space-y-4 max-w-md">
          <div className="inline-flex items-center gap-1 text-primary mb-2">
            {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
            <span className="ml-2 text-sm text-muted-foreground">Loved by 2,000+ brands</span>
          </div>
          {proof.map((p, i) => (
            <div key={i} className="p-5 rounded-2xl bg-card border border-border/60 backdrop-blur"
              style={{ transform: `translateX(${i % 2 ? 24 : 0}px)` }}>
              <p className="text-sm leading-relaxed mb-3">"{p.t}"</p>
              <div className="text-xs"><span className="font-semibold">{p.n}</span> · <span className="text-muted-foreground">{p.r}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
