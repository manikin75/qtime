import { ClockIcon } from '@phosphor-icons/react';

const KeyboardShortcut = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="bg-cyan-800 text-cyan-400 border-cyan-500 border rounded px-2 py-1">
      {children}
    </span>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white w-screen">
      <header className="flex flex-row gap-x-2 items-center justify-center h-10 w-full px-20 text-center ">
        <ClockIcon size={'1.35em'} weight="bold" />
        <h1 className="text-xl font-bold">QTime</h1>
      </header>
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-6em)] px-20 text-center bg-slate-800">
        {children}
      </main>
      <footer className="flex flex-col items-center justify-center h-2 w-full px-20 text-center">
        <div className="text-xs mt-8 flex flex-row gap-5 items-start justify-end">
          <div>
            <KeyboardShortcut>Arrow</KeyboardShortcut> navigate between cells
          </div>
          <div>
            <KeyboardShortcut>Shift+arrow</KeyboardShortcut> select range of
            cells
          </div>
          <div>
            <KeyboardShortcut>Ctrl+C</KeyboardShortcut> copy selected cells
          </div>
          <div>
            <KeyboardShortcut>Ctrl+V</KeyboardShortcut> paste cells from
            clipboard
          </div>
          <div>
            <KeyboardShortcut>0-9</KeyboardShortcut> set value in selected cells
          </div>
        </div>
      </footer>
    </div>
  );
};
