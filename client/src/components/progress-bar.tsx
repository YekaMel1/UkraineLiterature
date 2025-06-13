interface ProgressBarProps {
  progress: number;
  label?: string;
}

const ProgressBar = ({ progress, label }: ProgressBarProps) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div>
      <div className="mb-2 relative h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-primary rounded-full" 
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
      {label && <p className="text-sm text-neutral-700">{label}</p>}
    </div>
  );
};

export default ProgressBar;
