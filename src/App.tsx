import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from './components/WithTooltip';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { hotkeysDevtoolsPlugin } from '@tanstack/react-hotkeys-devtools';
import { TimeReport } from './pages/TimeReport';
import './dist.css';

const queryClient = new QueryClient();

function App() {
  console.log(import.meta.env.VITE_CLIENT_ID);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <Routes>
            <Route path={'/'} element={<TimeReport />} />
          </Routes>
        </Router>
      </TooltipProvider>
      <TanStackDevtools plugins={[hotkeysDevtoolsPlugin()]} />
    </QueryClientProvider>
  );
}

export default App;
