'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

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

interface CharacterPosition {
  faceX: number;
  faceY: number;
  bodySkew: number;
}

interface CharactersSceneProps {
  isTyping: boolean;
  isLookingAtEachOther: boolean;
  isPurplePeeking: boolean;
  password: string;
  showPassword: boolean;
}

interface AnimatedAuthLayoutProps {
  children: React.ReactNode;
  isTyping: boolean;
  isLookingAtEachOther: boolean;
  isPurplePeeking: boolean;
  password: string;
  showPassword: boolean;
}

interface SignInPageProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string;
  isPending?: boolean;
  signUpHref?: string;
}

interface SignUpPageProps {
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  error?: string;
  success?: string;
  isPending?: boolean;
  signInHref?: string;
}

function calculateEyePosition(
  mouse: { x: number; y: number },
  maxDistance: number,
  forceLookX?: number,
  forceLookY?: number,
) {
  if (forceLookX !== undefined && forceLookY !== undefined) {
    return { x: forceLookX, y: forceLookY };
  }

  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }

  const dx = mouse.x - window.innerWidth / 2;
  const dy = mouse.y - window.innerHeight / 2;
  const distance = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
  const angle = Math.atan2(dy, dx);

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

function calculateCharacterPosition(
  mouse: { x: number; y: number },
  intensity = 1,
): CharacterPosition {
  if (typeof window === 'undefined') {
    return { faceX: 0, faceY: 0, bodySkew: 0 };
  }

  const dx = (mouse.x - window.innerWidth / 2) * intensity;
  const dy = (mouse.y - window.innerHeight / 2) * intensity;

  return {
    faceX: Math.max(-15, Math.min(15, dx / 20)),
    faceY: Math.max(-10, Math.min(10, dy / 30)),
    bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
  };
}

function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  return isMounted;
}

function useMousePosition() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMouse({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return mouse;
}

function useBlinking() {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout> | null = null;
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null;

    const scheduleBlink = () => {
      blinkTimeout = setTimeout(
        () => {
          setIsBlinking(true);
          resumeTimeout = setTimeout(() => {
            setIsBlinking(false);
            scheduleBlink();
          }, 150);
        },
        Math.random() * 4000 + 3000,
      );
    };

    scheduleBlink();

    return () => {
      if (blinkTimeout) clearTimeout(blinkTimeout);
      if (resumeTimeout) clearTimeout(resumeTimeout);
    };
  }, []);

  return isBlinking;
}

function useAuthAnimationState() {
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const lookAtTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peekStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const peekEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (lookAtTimeoutRef.current) clearTimeout(lookAtTimeoutRef.current);
      if (peekStartTimeoutRef.current)
        clearTimeout(peekStartTimeoutRef.current);
      if (peekEndTimeoutRef.current) clearTimeout(peekEndTimeoutRef.current);
    };
  }, []);

  const startTyping = () => {
    setIsTyping(true);
    setIsLookingAtEachOther(true);

    if (lookAtTimeoutRef.current) clearTimeout(lookAtTimeoutRef.current);
    lookAtTimeoutRef.current = setTimeout(
      () => setIsLookingAtEachOther(false),
      800,
    );
  };

  const stopTyping = () => {
    setIsTyping(false);
  };

  const schedulePurplePeek = (password: string, showPassword: boolean) => {
    if (peekStartTimeoutRef.current) clearTimeout(peekStartTimeoutRef.current);
    if (peekEndTimeoutRef.current) clearTimeout(peekEndTimeoutRef.current);

    if (!password || !showPassword) {
      setIsPurplePeeking(false);
      return;
    }

    peekStartTimeoutRef.current = setTimeout(
      () => {
        setIsPurplePeeking(true);
        peekEndTimeoutRef.current = setTimeout(
          () => setIsPurplePeeking(false),
          800,
        );
      },
      Math.random() * 3000 + 2000,
    );
  };

  return {
    isTyping,
    isLookingAtEachOther,
    isPurplePeeking,
    startTyping,
    stopTyping,
    schedulePurplePeek,
  };
}

function Pupil({
  size = 12,
  maxDistance = 5,
  pupilColor = '#2D2D2D',
  forceLookX,
  forceLookY,
}: PupilProps) {
  const isMounted = useIsMounted();
  const mouse = useMousePosition();
  const position = useMemo(
    () => calculateEyePosition(mouse, maxDistance, forceLookX, forceLookY),
    [mouse, maxDistance, forceLookX, forceLookY],
  );

  if (!isMounted) {
    return (
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: pupilColor,
        }}
      />
    );
  }

  return (
    <div
      className="rounded-full"
      suppressHydrationWarning
      style={{
        width: size,
        height: size,
        backgroundColor: pupilColor,
        transform: `translate(${position.x}px,${position.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
}

function EyeBall({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = 'white',
  pupilColor = '#2D2D2D',
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) {
  const isMounted = useIsMounted();
  const mouse = useMousePosition();
  const position = useMemo(
    () => calculateEyePosition(mouse, maxDistance, forceLookX, forceLookY),
    [mouse, maxDistance, forceLookX, forceLookY],
  );

  return (
    <div
      className="flex items-center justify-center rounded-full transition-all duration-150"
      suppressHydrationWarning
      style={{
        width: size,
        height: isBlinking ? 2 : size,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && isMounted && (
        <div
          className="rounded-full"
          suppressHydrationWarning
          style={{
            width: pupilSize,
            height: pupilSize,
            backgroundColor: pupilColor,
            transform: `translate(${position.x}px,${position.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
      {!isBlinking && !isMounted && (
        <div
          className="rounded-full"
          style={{
            width: pupilSize,
            height: pupilSize,
            backgroundColor: pupilColor,
          }}
        />
      )}
    </div>
  );
}

function CharactersScene({
  isTyping,
  isLookingAtEachOther,
  isPurplePeeking,
  password,
  showPassword,
}: CharactersSceneProps) {
  const isMounted = useIsMounted();
  const mouse = useMousePosition();
  const isPurpleBlinking = useBlinking();
  const isBlackBlinking = useBlinking();

  const positions = useMemo(
    () => ({
      purple: calculateCharacterPosition(mouse, 1),
      black: calculateCharacterPosition(mouse, 0.75),
      yellow: calculateCharacterPosition(mouse, 0.6),
      orange: calculateCharacterPosition(mouse, 0.9),
    }),
    [mouse],
  );

  // Use stable positions during SSR to avoid hydration mismatch
  const purple = isMounted
    ? positions.purple
    : { faceX: 0, faceY: 0, bodySkew: 0 };
  const black = isMounted
    ? positions.black
    : { faceX: 0, faceY: 0, bodySkew: 0 };
  const yellow = isMounted
    ? positions.yellow
    : { faceX: 0, faceY: 0, bodySkew: 0 };
  const orange = isMounted
    ? positions.orange
    : { faceX: 0, faceY: 0, bodySkew: 0 };
  const hiding = password.length > 0 && !showPassword;
  const peeking = password.length > 0 && showPassword;

  return (
    <div className="relative" style={{ width: 550, height: 400 }}>
      <div
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        suppressHydrationWarning
        style={{
          left: 70,
          width: 180,
          height: isTyping || hiding ? 440 : 400,
          backgroundColor: '#6C3FF5',
          borderRadius: '10px 10px 0 0',
          zIndex: 1,
          transform: peeking
            ? 'skewX(0deg)'
            : isTyping || hiding
              ? `skewX(${purple.bodySkew - 12}deg) translateX(40px)`
              : `skewX(${purple.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-700 ease-in-out"
          suppressHydrationWarning
          style={{
            left: peeking ? 20 : isLookingAtEachOther ? 55 : 45 + purple.faceX,
            top: peeking ? 35 : isLookingAtEachOther ? 65 : 40 + purple.faceY,
          }}
        >
          <EyeBall
            size={18}
            pupilSize={7}
            maxDistance={5}
            isBlinking={isPurpleBlinking}
            forceLookX={
              peeking
                ? isPurplePeeking
                  ? 4
                  : -4
                : isLookingAtEachOther
                  ? 3
                  : undefined
            }
            forceLookY={
              peeking
                ? isPurplePeeking
                  ? 5
                  : -4
                : isLookingAtEachOther
                  ? 4
                  : undefined
            }
          />
          <EyeBall
            size={18}
            pupilSize={7}
            maxDistance={5}
            isBlinking={isPurpleBlinking}
            forceLookX={
              peeking
                ? isPurplePeeking
                  ? 4
                  : -4
                : isLookingAtEachOther
                  ? 3
                  : undefined
            }
            forceLookY={
              peeking
                ? isPurplePeeking
                  ? 5
                  : -4
                : isLookingAtEachOther
                  ? 4
                  : undefined
            }
          />
        </div>
      </div>

      <div
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        suppressHydrationWarning
        style={{
          left: 240,
          width: 120,
          height: 310,
          backgroundColor: '#2D2D2D',
          borderRadius: '8px 8px 0 0',
          zIndex: 2,
          transform: peeking
            ? 'skewX(0deg)'
            : isLookingAtEachOther
              ? `skewX(${black.bodySkew * 1.5 + 10}deg) translateX(20px)`
              : isTyping || hiding
                ? `skewX(${black.bodySkew * 1.5}deg)`
                : `skewX(${black.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-700 ease-in-out"
          suppressHydrationWarning
          style={{
            left: peeking ? 10 : isLookingAtEachOther ? 32 : 26 + black.faceX,
            top: peeking ? 28 : isLookingAtEachOther ? 12 : 32 + black.faceY,
          }}
        >
          <EyeBall
            size={16}
            pupilSize={6}
            maxDistance={4}
            isBlinking={isBlackBlinking}
            forceLookX={peeking ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={peeking ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
          <EyeBall
            size={16}
            pupilSize={6}
            maxDistance={4}
            isBlinking={isBlackBlinking}
            forceLookX={peeking ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={peeking ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
        </div>
      </div>

      <div
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        suppressHydrationWarning
        style={{
          left: 0,
          width: 240,
          height: 200,
          backgroundColor: '#FF9B6B',
          borderRadius: '120px 120px 0 0',
          zIndex: 3,
          transform: peeking ? 'skewX(0deg)' : `skewX(${orange.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-200 ease-out"
          suppressHydrationWarning
          style={{
            left: peeking ? 50 : 82 + orange.faceX,
            top: peeking ? 85 : 90 + orange.faceY,
          }}
        >
          <Pupil
            size={12}
            maxDistance={5}
            forceLookX={peeking ? -5 : undefined}
            forceLookY={peeking ? -4 : undefined}
          />
          <Pupil
            size={12}
            maxDistance={5}
            forceLookX={peeking ? -5 : undefined}
            forceLookY={peeking ? -4 : undefined}
          />
        </div>
      </div>

      <div
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        suppressHydrationWarning
        style={{
          left: 310,
          width: 140,
          height: 230,
          backgroundColor: '#E8D754',
          borderRadius: '70px 70px 0 0',
          zIndex: 4,
          transform: peeking ? 'skewX(0deg)' : `skewX(${yellow.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-200 ease-out"
          suppressHydrationWarning
          style={{
            left: peeking ? 20 : 52 + yellow.faceX,
            top: peeking ? 35 : 40 + yellow.faceY,
          }}
        >
          <Pupil
            size={12}
            maxDistance={5}
            forceLookX={peeking ? -5 : undefined}
            forceLookY={peeking ? -4 : undefined}
          />
          <Pupil
            size={12}
            maxDistance={5}
            forceLookX={peeking ? -5 : undefined}
            forceLookY={peeking ? -4 : undefined}
          />
        </div>
        <div
          className="absolute h-[4px] w-20 rounded-full bg-[#2D2D2D] transition-all duration-200 ease-out"
          suppressHydrationWarning
          style={{
            left: peeking ? 10 : 40 + yellow.faceX,
            top: peeking ? 88 : 88 + yellow.faceY,
          }}
        />
      </div>
    </div>
  );
}

export function AnimatedAuthLayout({
  children,
  isTyping,
  isLookingAtEachOther,
  isPurplePeeking,
  password,
  showPassword,
}: AnimatedAuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#002e6b] via-[#0a4b93] to-[#003d8f] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-20 flex items-center gap-2 text-lg font-semibold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Coolhat logo" className="object-cover" />
          </div>
          <span>
            <NextLink
              href="/"
              className="transition-colors hover:text-[#c61c2f]"
            >
              Coolhat
            </NextLink>
          </span>
        </div>

        <div className="relative z-20 flex h-[500px] items-end justify-center">
          <CharactersScene
            isTyping={isTyping}
            isLookingAtEachOther={isLookingAtEachOther}
            isPurplePeeking={isPurplePeeking}
            password={password}
            showPassword={showPassword}
          />
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-white/60">
          <a href="#" className="transition-colors hover:text-white">
            Privacy Policy
          </a>
          <a href="#" className="transition-colors hover:text-white">
            Terms of Service
          </a>
          <a href="#" className="transition-colors hover:text-white">
            Contact
          </a>
        </div>

        <div
          className="absolute inset-0 bg-[size:20px_20px]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          }}
        />
        <div className="absolute right-1/4 top-1/4 size-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="flex items-center justify-center bg-white p-8">
        {children}
      </div>
    </div>
  );
}

export function AnimatedSignIn({
  onSubmit,
  error,
  isPending,
  signUpHref = '/sign-up',
}: SignInPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const authAnimation = useAuthAnimationState();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <AnimatedAuthLayout
      isTyping={authAnimation.isTyping}
      isLookingAtEachOther={authAnimation.isLookingAtEachOther}
      isPurplePeeking={authAnimation.isPurplePeeking}
      password={password}
      showPassword={showPassword}
    >
      <div className="w-full max-w-[420px]">
        <div className="mb-12 flex items-center justify-center gap-2 text-lg font-semibold lg:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-sm font-bold text-primary">C</span>
          </div>
          <span>Coolhat</span>
        </div>

        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
            Sign in
          </p>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#002e6b]">
            Welcome back!
          </h1>
          <p className="text-sm text-black">
            Enter your account details to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="py-2 text-md font-medium text-black"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="owner@shop.com"
              value={email}
              autoComplete="off"
              onChange={(event) => setEmail(event.target.value)}
              onFocus={authAnimation.startTyping}
              onBlur={authAnimation.stopTyping}
              required
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-black focus:border-[#002e6b]"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="py-2 text-md font-medium text-black"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(event) => {
                  const nextPassword = event.target.value;
                  setPassword(nextPassword);
                  authAnimation.schedulePurplePeek(nextPassword, showPassword);
                }}
                onFocus={authAnimation.startTyping}
                onBlur={authAnimation.stopTyping}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50 pr-10 text-black focus:border-[#002e6b]"
              />
              <button
                type="button"
                onClick={() => {
                  const nextShowPassword = !showPassword;
                  setShowPassword(nextShowPassword);
                  authAnimation.schedulePurplePeek(password, nextShowPassword);
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <Label
                htmlFor="remember"
                className="cursor-pointer text-md font-normal text-black"
              >
                Remember for 30 days
              </Label>
            </div>
            <a
              href="#"
              className="text-sm font-medium text-[#c61c2f] hover:underline"
            >
              Forgot password?
            </a>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-[#002e6b] text-base font-medium text-white hover:bg-[#003d8f]"
            disabled={isPending}
          >
            {isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-black">
          Don&apos;t have an account?{' '}
          <a
            href={signUpHref}
            className="font-semibold text-[#c61c2f] hover:underline"
          >
            Sign up
          </a>
        </p>
      </div>
    </AnimatedAuthLayout>
  );
}

export function AnimatedSignUp({
  onSubmit,
  error,
  success,
  isPending,
  signInHref = '/sign-in',
}: SignUpPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const authAnimation = useAuthAnimationState();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(name, email, password);
  };

  return (
    <AnimatedAuthLayout
      isTyping={authAnimation.isTyping}
      isLookingAtEachOther={authAnimation.isLookingAtEachOther}
      isPurplePeeking={authAnimation.isPurplePeeking}
      password={password}
      showPassword={showPassword}
    >
      <div className="w-full max-w-[420px]">
        <div className="mb-10 flex items-center justify-center gap-2 text-lg font-semibold lg:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-sm font-bold text-primary">C</span>
          </div>
          <span>Coolhat</span>
        </div>

        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
            Sign up
          </p>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#002e6b]">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Start your 14-day free trial - no credit card needed
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="py-2 text-md font-medium text-black"
            >
              Full name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onFocus={authAnimation.startTyping}
              onBlur={authAnimation.stopTyping}
              required
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-black focus:border-[#002e6b]"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="py-2 text-md font-medium text-black"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="owner@shop.com"
              value={email}
              autoComplete="off"
              onChange={(event) => setEmail(event.target.value)}
              onFocus={authAnimation.startTyping}
              onBlur={authAnimation.stopTyping}
              required
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-black focus:border-[#002e6b]"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="py-2 text-md font-medium text-black"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => {
                  const nextPassword = event.target.value;
                  setPassword(nextPassword);
                  authAnimation.schedulePurplePeek(nextPassword, showPassword);
                }}
                onFocus={authAnimation.startTyping}
                onBlur={authAnimation.stopTyping}
                required
                minLength={8}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 pr-10 text-black focus:border-[#002e6b]"
              />
              <button
                type="button"
                onClick={() => {
                  const nextShowPassword = !showPassword;
                  setShowPassword(nextShowPassword);
                  authAnimation.schedulePurplePeek(password, nextShowPassword);
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-[#002e6b] text-base font-medium text-white hover:bg-[#003d8f]"
            disabled={isPending}
          >
            {isPending ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-black">
          Already have an account?{' '}
          <a
            href={signInHref}
            className="font-semibold text-[#c61c2f] hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </AnimatedAuthLayout>
  );
}
