import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import { TimeReport } from './pages/TimeReport';
import './dist.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path={'/'} element={<TimeReport />} />
      </Routes>
    </Router>
  );
}

export default App;
