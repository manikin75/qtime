import { cn } from '@sglara/cn';

interface ButtonProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const Button = ({
  children,
  size = 'md',
  className,
  onClick,
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'bg-cyan-800 border border-cyan-600 hover:bg-cyan-600 hover:cursor-pointer text-white rounded ',
        size === 'sm' && 'px-2 py-1 text-sm',
        size === 'md' && 'px-4 py-2',
        size === 'lg' && 'px-6 py-3',
        className,
      )}
      // style={{backgroundColor: '#469'}}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
