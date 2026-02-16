import { cn } from '@sglara/cn';

interface ButtonProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button = ({
  children,
  size = 'md',
  className,
  onClick,
  disabled = false,
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'bg-transparent border border-white hover:bg-stone-700 hover:cursor-pointer text-white rounded-lg ',
        size === 'sm' && 'px-2 py-2 text-sm',
        size === 'md' && 'px-6 py-3',
        size === 'lg' && 'px-8 py-4',
        disabled && 'opacity-50 !cursor-not-allowed',
        className,
      )}
      // style={{backgroundColor: '#469'}}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
