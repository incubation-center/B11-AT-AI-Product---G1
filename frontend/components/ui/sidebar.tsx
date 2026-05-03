'use client';

import { cn } from '@/lib/utils';
import Link, { type LinkProps } from 'next/link';
import React, { createContext, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

interface SidebarLinkItem {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }

  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

type SidebarBodyProps = Omit<
  React.ComponentProps<typeof motion.div>,
  'children'
> & {
  children: React.ReactNode;
};

export const SidebarBody = ({
  children,
  className,
  ...props
}: SidebarBodyProps) => {
  return (
    <>
      <DesktopSidebar className={className} {...props}>
        {children}
      </DesktopSidebar>
      <MobileSidebar>{children}</MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.div
      className={cn(
        'hidden h-screen flex-shrink-0 border-r border-slate-200 bg-white/85 px-4 py-4 backdrop-blur md:flex md:flex-col',
        className,
      )}
      animate={{
        width: animate ? (open ? '300px' : '72px') : '300px',
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      <div
        className={cn(
          'sticky top-0 z-40 flex h-16 w-full flex-none items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur md:hidden',
        )}
        {...props}
      >
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Menu
          </span>
          <span className="text-sm font-bold text-[#002e6b]">
            Owner Dashboard
          </span>
        </div>
        <button
          type="button"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"
          onClick={() => setOpen(!open)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] md:hidden"
            >
              <button
                type="button"
                aria-label="Close navigation menu backdrop"
                className="absolute inset-0 h-full w-full bg-slate-950/45 backdrop-blur-[2px]"
                onClick={() => setOpen(false)}
              />

              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{
                  duration: 0.28,
                  ease: 'easeInOut',
                }}
                className="absolute right-0 top-0 flex h-dvh w-[86vw] max-w-[340px] flex-col overflow-hidden rounded-l-[28px] bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Navigation
                    </p>
                    <p className="text-sm font-bold text-[#002e6b]">
                      Dashboard
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close navigation menu"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-5 py-5">
                  {children}
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  active = false,
  className,
  ...props
}: Omit<LinkProps, 'href'> & {
  link: SidebarLinkItem;
  active?: boolean;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  const icon = React.isValidElement<{ className?: string }>(link.icon)
    ? React.cloneElement(link.icon, {
        className: cn(
          link.icon.props.className,
          active ? 'text-white' : 'text-slate-700',
        ),
      })
    : link.icon;

  return (
    <Link
      href={link.href}
      className={cn(
        'group/sidebar flex items-center justify-start gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-slate-100',
        className,
      )}
      {...props}
    >
      {icon}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          'inline-block whitespace-pre text-sm font-semibold transition duration-150 group-hover/sidebar:translate-x-1 !m-0 !p-0',
          active ? 'text-white' : 'text-slate-700',
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
