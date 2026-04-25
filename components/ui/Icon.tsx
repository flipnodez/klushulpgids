import type { LucideIcon, LucideProps } from 'lucide-react'
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  Flame,
  Grid3x3,
  Hammer,
  HardHat,
  Home,
  Info,
  Layers,
  List,
  Mail,
  Map,
  MapPin,
  Minus,
  Moon,
  PaintBucket,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Square,
  Star,
  Sun,
  Trees,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react'

/**
 * Wrapper rond Lucide React icons. **Editorial regel:** standaard
 * `strokeWidth: 1.5` (zoals SKILL.md voorschrijft) — niet de Lucide-default 2,
 * dat past niet bij de krant-editorial stijl.
 *
 * Iconen renderen altijd in `currentColor` (= tekstkleur). Geen icon-pills,
 * geen gekleurde achtergronden.
 */

export const ICON_MAP = {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  Flame,
  Grid3x3,
  Hammer,
  HardHat,
  Home,
  Info,
  Layers,
  List,
  Mail,
  Map,
  MapPin,
  Minus,
  Moon,
  PaintBucket,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Square,
  Star,
  Sun,
  Trees,
  Users,
  Wrench,
  X,
  Zap,
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICON_MAP

type IconProps = Omit<LucideProps, 'ref'> & {
  name: IconName
  /** Default 18 — past bij Inter 14-16px tekst */
  size?: number
  /** Default 1.5 — editorial standaard, NIET Lucide's default 2 */
  strokeWidth?: number
}

export function Icon({ name, size = 18, strokeWidth = 1.5, ...rest }: IconProps) {
  const Cmp = ICON_MAP[name]
  return <Cmp size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />
}
