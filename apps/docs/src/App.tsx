import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout';
import Dashboard from './pages/Dashboard';

function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <Router basename={basename}>
      <Switch>
        <Route exact path="/">
          <DefaultLayout>
            <Dashboard />
          </DefaultLayout>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
