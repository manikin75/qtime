import { formatForDisplay } from '@tanstack/react-hotkeys';

const KeyboardShortcut = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="text-white text-[0.85em] border-white border p-1 py-0.5 rounded-sm">
      {children}
    </span>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col justify-center min-h-screen bg-[#232222] text-white w-screen">
      <div className="h-auto w-360 flex flex-col m-auto justify-center items-center">
        <header className="flex flex-row gap-x-2 items-center justify-left h-10 w-full text-center border-b border-white">
          <div className="text-left">
            <h1 className="text-2xl font-bold">QTime</h1>
          </div>
        </header>
        <main className="flex flex-col items-center justify-between m-y-10 w-full text-center ">
          {children}
        </main>
        <footer className="flex flex-col items-center justify-center h-2 w-full text-center border-t border-white mt-20">
          <div className="text-xs mt-8 flex flex-row gap-8 justify-between">
            <div className="flex flex-row gap-1 items-center">
              <KeyboardShortcut>{formatForDisplay('Tab')}</KeyboardShortcut>{' '}
              Jump with tab
            </div>
            <div className="flex flex-row gap-1 items-center">
              <KeyboardShortcut>{formatForDisplay('Arrows')}</KeyboardShortcut>
              <span>navigate between cells</span>
            </div>
            <div className="flex flex-row gap-1 items-center">
              {/* <ArrowFatUpIcon size={18} />
              <ArrowSquareRightIcon size={18} /> */}
              <KeyboardShortcut>
                {formatForDisplay('Shift+Arrows')}
              </KeyboardShortcut>
              <span>select range of cells</span>
            </div>
            <div className="flex flex-row gap-1 items-center">
              {/* <ControlIcon size={18} /> */}
              <KeyboardShortcut>
                {formatForDisplay('Mod+C')}
              </KeyboardShortcut> /{' '}
              <KeyboardShortcut>{formatForDisplay('Mod+V')}</KeyboardShortcut>
              <span>copy/paste selected cells</span>
            </div>
            <div className="flex flex-row gap-1 items-center">
              <KeyboardShortcut>{formatForDisplay('Mod+Z')}</KeyboardShortcut>
              undo
            </div>
            <div className="flex flex-row gap-1 items-center">
              <KeyboardShortcut>{formatForDisplay('Mod+A')}</KeyboardShortcut>
              <span>mark absence</span>
            </div>
            <div className="flex flex-row gap-1 items-center">
              <KeyboardShortcut>0</KeyboardShortcut> -{' '}
              <KeyboardShortcut>9</KeyboardShortcut>{' '}
              <span>set value in selected cells</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
