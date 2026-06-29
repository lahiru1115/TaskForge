import logoUrl from '@/assets/logo.svg'

interface AppLogoProps {
  size?: number
  className?: string
}

export default function AppLogo({ size = 32, className }: AppLogoProps) {
  return (
    <img
      src={logoUrl}
      width={size}
      height={size}
      alt="TaskForge"
      draggable={false}
      className={className}
    />
  )
}
