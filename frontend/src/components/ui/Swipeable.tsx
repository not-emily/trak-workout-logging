import { type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type SwipeAction = {
  icon: LucideIcon;
  bg: string;
  onTrigger: () => void;
};

type Props = {
  children: ReactNode;
  enabled?: boolean;
  /** Swipe right (finger left→right). Icon reveals on the left side. */
  right?: SwipeAction;
  /** Swipe left (finger right→left). Icon reveals on the right side. */
  left?: SwipeAction;
};

const SWIPE_THRESHOLD = 120;

// Pinning y to a MotionValue and resetting per-tick is what keeps the swipe
// strictly horizontal — drag="x" alone leaks a y delta proportional to x.
export function Swipeable({ children, enabled = true, right, left }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rightOpacity = useTransform(x, [0, 40, SWIPE_THRESHOLD], [0, 0.3, 1]);
  const rightScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1]);
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, -40, 0], [1, 0.3, 0]);
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.5]);

  if (!enabled || (!right && !left)) return <>{children}</>;

  const RightIcon = right?.icon;
  const LeftIcon = left?.icon;

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-lg"
      exit={{
        opacity: 0,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        transition: { duration: 0.2 },
      }}
    >
      {right && RightIcon && (
        <motion.div
          className={`absolute inset-0 flex items-center rounded-lg pl-4 ${right.bg}`}
          style={{ opacity: rightOpacity }}
        >
          <motion.div style={{ scale: rightScale }}>
            <RightIcon className="h-5 w-5 text-white" />
          </motion.div>
        </motion.div>
      )}
      {left && LeftIcon && (
        <motion.div
          className={`absolute inset-0 flex items-center justify-end rounded-lg pr-4 ${left.bg}`}
          style={{ opacity: leftOpacity }}
        >
          <motion.div style={{ scale: leftScale }}>
            <LeftIcon className="h-5 w-5 text-white" />
          </motion.div>
        </motion.div>
      )}

      <motion.div
        drag="x"
        dragConstraints={{
          left: left ? -SWIPE_THRESHOLD * 1.25 : 0,
          right: right ? SWIPE_THRESHOLD * 1.25 : 0,
        }}
        dragElastic={0.15}
        dragMomentum={false}
        style={{ x, y }}
        onDrag={() => {
          if (y.get() !== 0) y.set(0);
        }}
        onDragEnd={(_e, info) => {
          if (right && info.offset.x > SWIPE_THRESHOLD) right.onTrigger();
          else if (left && info.offset.x < -SWIPE_THRESHOLD) left.onTrigger();
          animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
          y.set(0);
        }}
        className="relative touch-pan-y"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
