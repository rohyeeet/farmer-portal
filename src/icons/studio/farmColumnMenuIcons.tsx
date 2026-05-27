import type { ReactNode } from 'react'
import {
  Building2,
  Calculator,
  Calendar,
  CheckCircle,
  Database,
  FileText,
  GanttChart,
  Globe,
  Hash,
  Leaf,
  Map,
  MapPin,
  Settings,
  Target,
  TreePine,
  User,
  Users,
} from 'lucide-react'

/** Same heuristics as Studio `AddColumn` `getColumnIcon` — maps column label → left icon */
export function farmColumnMenuIcon(columnLabel: string): ReactNode {
  const name = columnLabel.toLowerCase()

  if (name.includes('cra') || name.includes('fpic')) {
    return <FileText className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (
    name.includes('id') ||
    name.includes('farm id') ||
    name.includes('farmer id') ||
    name.includes('kyari id') ||
    name.includes('surveyor id')
  ) {
    return <Hash className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (
    name.includes('name') ||
    name.includes('first name') ||
    name.includes('last name')
  ) {
    return <User className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (
    name.includes('status') ||
    name.includes('verification') ||
    name.includes('documentation')
  ) {
    return <CheckCircle className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('document')) {
    return <FileText className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('feasibility') || name.includes('prefeasibility')) {
    return <Target className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('surveyor') || name.includes('assignee')) {
    return <Users className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (
    name.includes('organization') ||
    name.includes('tenant') ||
    name.includes('organisation')
  ) {
    return <Building2 className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('area') || name.includes('acres') || name.includes('calculated')) {
    return <Calculator className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (
    name.includes('country') ||
    name.includes('state') ||
    name.includes('district') ||
    name.includes('block')
  ) {
    return <MapPin className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('created') || name.includes('date') || name.includes('onboarded')) {
    return <Calendar className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('type') || name.includes('farm type') || name.includes('kyari type')) {
    return <Leaf className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('boundary')) {
    return <Map className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('actions') || name.includes('action')) {
    return <Settings className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (
    name.includes('trees') ||
    name.includes('sapling') ||
    name.includes('baseline') ||
    name.includes('retro')
  ) {
    return <TreePine className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('year')) {
    return <Calendar className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('count') || name.includes('total')) {
    return <Database className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('plantation') || name.includes('specie')) {
    return <GanttChart className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('ownership')) {
    return <Globe className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('village')) {
    return <MapPin className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('active')) {
    return <CheckCircle className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }
  if (name.includes('submitted')) {
    return <Calculator className="farm-workbench__column-menu-icon" size={16} aria-hidden />
  }

  return <Hash className="farm-workbench__column-menu-icon" size={16} aria-hidden />
}
