interface PaymentProgressBarProps {
  progreso: number;
  size?: 'sm' | 'lg';
  showLabel?: boolean;
  className?: string;
}

function PaymentProgressBar({
  progreso,
  size = 'sm',
  showLabel = false,
  className,
}: PaymentProgressBarProps) {
  const clampedProgreso = Math.min(100, Math.max(0, progreso));

  const heightClass = size === 'lg' ? 'h-4' : 'h-2';

  const barColor =
    clampedProgreso === 100
      ? 'bg-emerald-500'
      : clampedProgreso >= 50
        ? 'bg-cyan-500'
        : 'bg-amber-500';

  return (
    <div className={className}>
      <div
        className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClass}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clampedProgreso}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-600 mt-1 block">
          {progreso.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

export default PaymentProgressBar;
