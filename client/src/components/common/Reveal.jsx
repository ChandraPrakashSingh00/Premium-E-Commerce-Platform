import { motion } from 'framer-motion';

/** Fades/slides content in once when it scrolls into view. */
export function Reveal({ as = 'div', delay = 0, y = 20, className, children, ...props }) {
  const Component = motion[as] ?? motion.div;
  return (
    <Component
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Reveal;
