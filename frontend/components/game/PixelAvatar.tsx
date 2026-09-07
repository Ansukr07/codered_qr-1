import { avatarFor } from '@/lib/game'

export function PixelAvatar({ avatarKey, size = 'md' }: { avatarKey?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const avatar = avatarFor(avatarKey)
  return <div className={`pixel-avatar pixel-avatar-${size}`} style={{ '--avatar-color': avatar.color } as React.CSSProperties} aria-label={`${avatar.name} avatar`}><span aria-hidden>{avatar.face}</span></div>
}
