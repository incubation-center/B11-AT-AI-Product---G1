"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// ─── Pupil ────────────────────────────────────────────────────────────────────

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

function Pupil({ size = 12, maxDistance = 5, pupilColor = "#2D2D2D", forceLookX, forceLookY }: PupilProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const pos = () => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };

  const p = pos();
  return (
    <div
      ref={ref}
      className="rounded-full"
      style={{
        width: size, height: size, backgroundColor: pupilColor,
        transform: `translate(${p.x}px,${p.y}px)`,
        transition: "transform 0.1s ease-out",
      }}
    />
  );
}

// ─── EyeBall ──────────────────────────────────────────────────────────────────

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

function EyeBall({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = "white", pupilColor = "#2D2D2D", isBlinking = false, forceLookX, forceLookY }: EyeBallProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const pos = () => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };

  const p = pos();
  return (
    <div
      ref={ref}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{ width: size, height: isBlinking ? 2 : size, backgroundColor: eyeColor, overflow: "hidden" }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: pupilSize, height: pupilSize, backgroundColor: pupilColor,
            transform: `translate(${p.x}px,${p.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
}

// ─── Characters scene ─────────────────────────────────────────────────────────

interface CharactersSceneProps {
  isTyping: boolean;
  password: string;
  showPassword: boolean;
}

function CharactersScene({ isTyping, password, showPassword }: CharactersSceneProps) {
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Blinking
  useEffect(() => {
    const scheduleBlink = (setter: (v: boolean) => void) => {
      const t = setTimeout(() => {
        setter(true);
        setTimeout(() => { setter(false); scheduleBlink(setter); }, 150);
      }, Math.random() * 4000 + 3000);
      return t;
    };
    const t1 = scheduleBlink(setIsPurpleBlinking);
    const t2 = scheduleBlink(setIsBlackBlinking);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Look at each other when typing starts
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const t = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(t);
    }
    setIsLookingAtEachOther(false);
  }, [isTyping]);

  // Sneaky peek when password visible
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const t = setTimeout(() => {
        setIsPurplePeeking(true);
        setTimeout(() => setIsPurplePeeking(false), 800);
      }, Math.random() * 3000 + 2000);
      return () => clearTimeout(t);
    }
    setIsPurplePeeking(false);
  }, [password, showPassword, isPurplePeeking]);

  const calcPos = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 3;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const p = calcPos(purpleRef);
  const b = calcPos(blackRef);
  const y = calcPos(yellowRef);
  const o = calcPos(orangeRef);

  const hiding = password.length > 0 && !showPassword;
  const peeking = password.length > 0 && showPassword;

  return (
    <div className="relative" style={{ width: 550, height: 400 }}>
      {/* Purple — back */}
      <div
        ref={purpleRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 70, width: 180,
          height: (isTyping || hiding) ? 440 : 400,
          backgroundColor: "#6C3FF5",
          borderRadius: "10px 10px 0 0",
          zIndex: 1,
          transform: peeking
            ? "skewX(0deg)"
            : (isTyping || hiding)
              ? `skewX(${(p.bodySkew || 0) - 12}deg) translateX(40px)`
              : `skewX(${p.bodySkew || 0}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-700 ease-in-out"
          style={{
            left: peeking ? 20 : isLookingAtEachOther ? 55 : 45 + p.faceX,
            top: peeking ? 35 : isLookingAtEachOther ? 65 : 40 + p.faceY,
          }}
        >
          <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={isPurpleBlinking}
            forceLookX={peeking ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={peeking ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
          />
          <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={isPurpleBlinking}
            forceLookX={peeking ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={peeking ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
          />
        </div>
      </div>

      {/* Black — middle */}
      <div
        ref={blackRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 240, width: 120, height: 310,
          backgroundColor: "#2D2D2D",
          borderRadius: "8px 8px 0 0",
          zIndex: 2,
          transform: peeking
            ? "skewX(0deg)"
            : isLookingAtEachOther
              ? `skewX(${(b.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
              : (isTyping || hiding)
                ? `skewX(${(b.bodySkew || 0) * 1.5}deg)`
                : `skewX(${b.bodySkew || 0}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-700 ease-in-out"
          style={{
            left: peeking ? 10 : isLookingAtEachOther ? 32 : 26 + b.faceX,
            top: peeking ? 28 : isLookingAtEachOther ? 12 : 32 + b.faceY,
          }}
        >
          <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking}
            forceLookX={peeking ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={peeking ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
          <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking}
            forceLookX={peeking ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={peeking ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
        </div>
      </div>

      {/* Orange — front left */}
      <div
        ref={orangeRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 0, width: 240, height: 200,
          backgroundColor: "#FF9B6B",
          borderRadius: "120px 120px 0 0",
          zIndex: 3,
          transform: peeking ? "skewX(0deg)" : `skewX(${o.bodySkew || 0}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-200 ease-out"
          style={{ left: peeking ? 50 : 82 + (o.faceX || 0), top: peeking ? 85 : 90 + (o.faceY || 0) }}
        >
          <Pupil size={12} maxDistance={5} forceLookX={peeking ? -5 : undefined} forceLookY={peeking ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} forceLookX={peeking ? -5 : undefined} forceLookY={peeking ? -4 : undefined} />
        </div>
      </div>

      {/* Yellow — front right */}
      <div
        ref={yellowRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 310, width: 140, height: 230,
          backgroundColor: "#E8D754",
          borderRadius: "70px 70px 0 0",
          zIndex: 4,
          transform: peeking ? "skewX(0deg)" : `skewX(${y.bodySkew || 0}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-200 ease-out"
          style={{ left: peeking ? 20 : 52 + (y.faceX || 0), top: peeking ? 35 : 40 + (y.faceY || 0) }}
        >
          <Pupil size={12} maxDistance={5} forceLookX={peeking ? -5 : undefined} forceLookY={peeking ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} forceLookX={peeking ? -5 : undefined} forceLookY={peeking ? -4 : undefined} />
        </div>
        <div
          className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
          style={{ left: peeking ? 10 : 40 + (y.faceX || 0), top: peeking ? 88 : 88 + (y.faceY || 0) }}
        />
      </div>
    </div>
  );
}

// ─── Auth Layout with animated characters ─────────────────────────────────────

interface AnimatedAuthLayoutProps {
  children: React.ReactNode;
  isTyping: boolean;
  password: string;
  showPassword: boolean;
}

export function AnimatedAuthLayout({ children, isTyping, password, showPassword }: AnimatedAuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — characters panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#002e6b] via-[#0a4b93] to-[#003d8f] p-12 text-white overflow-hidden">
        {/* Logo */}
        <div className="relative z-20 flex items-center gap-2 text-lg font-semibold">
          <div className="size-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Coolhat logo" className="object-cover" />
          </div>
          <span>
            <a href="/" className="hover:text-[#c61c2f] transition-colors">
              Coolhat
            </a>
          </span>
        </div>

        {/* Characters scene */}
        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <CharactersScene isTyping={isTyping} password={password} showPassword={showPassword} />
        </div>

        {/* Footer links */}
        <div className="relative z-20 flex items-center gap-8 text-sm text-white/60">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>

        {/* Decorative */}
        <div className="absolute inset-0 bg-[size:20px_20px]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)" }} />
        <div className="absolute top-1/4 right-1/4 size-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8 bg-white">
        {children}
      </div>
    </div>
  );
}

// ─── Sign In Page component ───────────────────────────────────────────────────

interface SignInPageProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string;
  isPending?: boolean;
  signUpHref?: string;
}

export function AnimatedSignIn({ onSubmit, error, isPending, signUpHref = "/sign-up" }: SignInPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <AnimatedAuthLayout isTyping={isTyping} password={password} showPassword={showPassword}>
      <div className="w-full max-w-[420px]">
        
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">C</span>
          </div>
          <span>Coolhat</span>
        </div>

        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f] mb-2">Sign in</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#002e6b] mb-2">Welcome back!</h1>
          <p className="text-black text-sm">Enter your account details to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-md text-black py-2 font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="owner@shop.com"
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              required
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-black focus:border-[#002e6b]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-md text-black py-2 font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 pr-10 rounded-xl border-slate-200 bg-slate-50 text-black focus:border-[#002e6b]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-md text-black font-normal cursor-pointer">Remember for 30 days</Label>
            </div>
            <a href="#" className="text-sm text-[#c61c2f] hover:underline font-medium">Forgot password?</a>
          </div>

          {error && (
            <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-[#002e6b] hover:bg-[#003d8f] text-white rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-black mt-8">
          Don&apos;t have an account?{" "}
          <a href={signUpHref} className="text-[#c61c2f] font-semibold hover:underline">Sign up</a>
        </p>
      </div>
    </AnimatedAuthLayout>
  );
}

// ─── Sign Up Page component ───────────────────────────────────────────────────

interface SignUpPageProps {
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  error?: string;
  success?: string;
  isPending?: boolean;
  signInHref?: string;
}

export function AnimatedSignUp({ onSubmit, error, success, isPending, signInHref = "/sign-in" }: SignUpPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(name, email, password);
  };

  return (
    <AnimatedAuthLayout isTyping={isTyping} password={password} showPassword={showPassword}>
      <div className="w-full max-w-[420px]">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-10">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">C</span>
          </div>
          <span>Coolhat</span>
        </div>        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f] mb-2">Sign up</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#002e6b] mb-2">Create your account</h1>
          <p className="text-muted-foreground text-sm">Start your 14-day free trial — no credit card needed</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-md text-black py-2 font-medium">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              required
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-black focus:border-[#002e6b]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-md text-black py-2 font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="owner@shop.com"
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              required
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-black focus:border-[#002e6b]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-md text-black py-2 font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-12 pr-10 rounded-xl border-slate-200 bg-slate-50 text-black focus:border-[#002e6b]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
              {success}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-[#002e6b] hover:bg-[#003d8f] text-white rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>

          <p className="text-center text-sm text-black mt-8">
          Already have an account?{" "}
          <a href={signInHref} className="text-[#c61c2f] font-semibold hover:underline">Sign in</a>
        </p>
      </div>
    </AnimatedAuthLayout>
  );
}
