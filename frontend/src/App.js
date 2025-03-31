import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UploadPage from './pages/UploadPage';
import InfringementPage from './pages/InfringementPage';

function PrivateRoute({ children, ...rest }) {
  // 簡易判斷 token
  const token = localStorage.getItem('token');
  return (
    <Route
      {...rest}
      render={() => token ? (children) : (<Redirect to="/login" />)}
    />
  );
}

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/login" component={LoginPage}/>
        <Route exact path="/register" component={RegisterPage}/>

        <PrivateRoute exact path="/upload">
          <UploadPage />
        </PrivateRoute>

        <PrivateRoute exact path="/infringements">
          <InfringementPage />
        </PrivateRoute>

        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </Router>
  );
}

function Home() {
  return (
    <div style={styles.homeContainer}>
      <h1>KaiKaiShield 首頁</h1>
      <p>選擇您要的功能：</p>
      <div style={styles.linkBox}>
        <a href="/login" style={styles.link}>登入</a>
      </div>
      <div style={styles.linkBox}>
        <a href="/register" style={styles.link}>註冊</a>
      </div>
      <div style={styles.linkBox}>
        <a href="/upload" style={styles.link}>上傳作品</a>
      </div>
      <div style={styles.linkBox}>
        <a href="/infringements" style={styles.link}>侵權管理</a>
      </div>
    </div>
  );
}

const styles = {
  homeContainer: {
    textAlign: 'center',
    marginTop: '50px'
  },
  linkBox: {
    border: '1px solid #ccc',
    padding: '10px',
    width: '200px',
    margin: '10px auto'
  },
  link: {
    textDecoration: 'none',
    color: '#007bff'
  }
};
