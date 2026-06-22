type Props = {
  streak: number
  longestStreak: number
}

export default function StreakCounter({ streak, longestStreak }: Props) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        <div>
          <p className="text-xs text-muted-foreground">Current Streak</p>
          <p className="text-xl font-bold leading-none">{streak}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">Longest Streak</p>
        <p className="text-xl font-bold leading-none">{longestStreak}</p>
      </div>
    </div>
  )
}
