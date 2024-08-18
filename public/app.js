import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import { HashRouter, Route } from 'react-router-dom';
import Home from './home';
import Deposit from './deposit';
import Withdraw from './withdraw';
import Balance from './balance';
import AllData from './alldata';
import CreateAccount from './createaccount';
import Login from './login';
import NavBar from './navbar';

export const UserContext = React.createContext();
function App() {
  const [token, setToken] = React.useState(localStorage.getItem('token'));
  const [user, setUser] = React.useState({});
  React.useEffect(async () => {
    if (token) {
      // localStorage.setItem('token', token);
      let response = await fetch('/account/getLogged', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json());
      if (response.success) {
        setUser(response.user[0]);
      } else {
        setToken('');
      }
    }
  }, [token]);
  return (
    <HashRouter>
      <div>
        <UserContext.Provider value={{ user, setToken, setUser }}>
          <NavBar />

          {/* <div className='container' style={{ padding: '20px' }}> */}
          <Route path='/' exact component={Home} />

          {user?._id ? (
            <>
              <Route path='/deposit/' component={Deposit} />
              <Route path='/withdraw/' component={Withdraw} />

              <Route path='/balance/' component={Balance} />
              <Route path='/alldata/' component={AllData} />
            </>
          ) : (
            <>
              <Route path='/CreateAccount/' component={CreateAccount} />
              <Route path='/login/' component={Login} />
            </>
          )}
          {/* </div> */}
        </UserContext.Provider>
      </div>
    </HashRouter>
  );
}

export default App;