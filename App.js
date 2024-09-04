import React from 'react';
import LoginForm from './LoginForm';
import useAuth from './useAuth';
import { getAuth, signOut } from 'firebase/auth';

function App() {
  const user = useAuth();
  return (
    <div>
      <h1>Sidepanel App</h1>
      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={() => signOut(getAuth())}>Logout</button>
        </div>
      ) : (
        <div>
          <p>Please log in:</p>
          <LoginForm />
        </div>
      )}
    </div>
  );
}

export default App;
