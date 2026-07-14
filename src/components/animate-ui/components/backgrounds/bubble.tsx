'use client';

import * as React from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type SpringOptions,
} from 'motion/react';

import { cn } from '@/lib/utils';

type BubbleColors = {
  first: string;
  second: string;
  third: string;
  fourth: string;
  fifth: string;
  sixth: string;
};

type BubbleBackgroundProps = React.ComponentProps<'div'> & {
  interactive?: boolean;
  transition?: SpringOptions;
  colors?: BubbleColors;
};

function BubbleBackground({
  ref,
  className,
  children,
  interactive = false,
  transition = { stiffness: 100, damping: 20 },
  colors = {
    first: '18,113,255',
    second: '221,74,255',
    third: '0,220,255',
    fourth: '200,50,50',
    fifth: '180,180,50',
    sixth: '140,100,255',
  },
  style,
  ...props
}: BubbleBackgroundProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);
  const prefersReducedMotion = useReducedMotion();
  const [isInView, setIsInView] = React.useState(true);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, transition);
  const springY = useSpring(mouseY, transition);

  const rectRef = React.useRef<DOMRect | null>(null);
  const rafIdRef = React.useRef<number | null>(null);
  const pointerRef = React.useRef({ x: 0, y: 0 });
  const filterId = React.useId().replace(/:/g, '');

  const backgroundStyle = React.useMemo(
    () =>
      ({
        ...style,
        '--first-color': colors.first,
        '--second-color': colors.second,
        '--third-color': colors.third,
        '--fourth-color': colors.fourth,
        '--fifth-color': colors.fifth,
        '--sixth-color': colors.sixth,
      }) as React.CSSProperties,
    [colors, style],
  );

  React.useLayoutEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        rectRef.current = containerRef.current.getBoundingClientRect();
      }
    };

    updateRect();

    const el = containerRef.current;
    const ro = new ResizeObserver(updateRect);
    if (el) ro.observe(el);

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry?.isIntersecting ?? true),
      { rootMargin: '120px' },
    );
    if (el) observer.observe(el);

    window.addEventListener('resize', updateRect, { passive: true });

    return () => {
      ro.disconnect();
      observer.disconnect();
      window.removeEventListener('resize', updateRect);
    };
  }, []);

  React.useEffect(() => {
    if (!interactive || !isInView || prefersReducedMotion) return;

    const el = containerRef.current;
    if (!el) return;

    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      if (rafIdRef.current != null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const rect = containerRef.current?.getBoundingClientRect() ?? rectRef.current;
        if (!rect) return;
        rectRef.current = rect;
        mouseX.set(pointerRef.current.x - (rect.left + rect.width / 2));
        mouseY.set(pointerRef.current.y - (rect.top + rect.height / 2));
      });
    };

    window.addEventListener('pointermove', handlePointerMove as EventListener, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove as EventListener);
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [interactive, isInView, mouseX, mouseY, prefersReducedMotion]);

  const animationsEnabled = isInView && !prefersReducedMotion;

  return (
    <div
      ref={containerRef}
      data-slot="bubble-background"
      className={cn(
        'relative w-full h-full overflow-hidden bg-gradient-to-br from-violet-900 to-blue-900 pointer-events-auto',
        className,
      )}
      style={backgroundStyle}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-0 left-0 w-0 h-0"
      >
        <defs>
          <filter id={filterId}>
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="16"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div
        className="absolute inset-0"
        style={{ filter: `url(#${filterId}) blur(40px)` }}
      >

        <motion.div
          className="absolute inset-0 flex justify-center items-center origin-[calc(50%-400px)]"
          animate={{ rotate: animationsEnabled ? 360 : 0 }}
          transition={{
            duration: animationsEnabled ? 20 : 0,
            ease: 'linear',
            repeat: animationsEnabled ? Infinity : 0,
            repeatType: 'loop',
          }}
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        >
          <div className="rounded-full size-[80%] top-[10%] left-[10%] mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--second-color),0.8)_0%,rgba(var(--second-color),0)_50%)]" />
        </motion.div>

        <motion.div
          className="absolute inset-0 flex justify-center items-center origin-[calc(50%+400px)]"
          animate={{ rotate: animationsEnabled ? 360 : 0 }}
          transition={{ duration: animationsEnabled ? 40 : 0, ease: 'linear', repeat: animationsEnabled ? Infinity : 0 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        >
          <div className="absolute rounded-full size-[80%] bg-[radial-gradient(circle_at_center,rgba(var(--third-color),0.8)_0%,rgba(var(--third-color),0)_50%)] mix-blend-hard-light top-[calc(50%+200px)] left-[calc(50%-500px)]" />
        </motion.div>

        <motion.div
          className="absolute rounded-full size-[80%] top-[10%] left-[10%] mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--fourth-color),0.8)_0%,rgba(var(--fourth-color),0)_50%)] opacity-70"
          animate={{ x: animationsEnabled ? [-50, 50, -50] : 0 }}
          transition={{ duration: animationsEnabled ? 40 : 0, ease: 'easeInOut', repeat: animationsEnabled ? Infinity : 0 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        />

        <motion.div
          className="absolute inset-0 flex justify-center items-center origin-[calc(50%_-_800px)_calc(50%_+_200px)]"
          animate={{ rotate: animationsEnabled ? 360 : 0 }}
          transition={{ duration: animationsEnabled ? 20 : 0, ease: 'linear', repeat: animationsEnabled ? Infinity : 0 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        >
          <div className="absolute rounded-full size-[160%] mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--fifth-color),0.8)_0%,rgba(var(--fifth-color),0)_50%)] top-[calc(50%-80%)] left-[calc(50%-80%)]" />
        </motion.div>

        {interactive && (
          <motion.div
            className="absolute rounded-full w-full h-full mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--sixth-color),0.8)_0%,rgba(var(--sixth-color),0)_50%)] opacity-70"
            style={{
              x: springX,
              y: springY,
              transform: 'translateZ(0)',
              willChange: 'transform',
            }}
          />
        )}
      </div>

      {children}
    </div>
  );
}

export { BubbleBackground, type BubbleBackgroundProps };
export default BubbleBackground;
