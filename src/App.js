import React, { useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Auth } from '@aws-amplify/auth';
//import { Auth } from 'aws-amplify';
import axios from 'axios';

const App = () => {
  const [user, setUser] = useState(null);
  const [s3Objects, setS3Objects] = useState([]);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    try {
      const user = await Auth.signIn('username', 'password'); // Or use Auth.federatedSignIn() for social login
      setUser(user);
      console.log('User signed in', user);
    } catch (error) {
      console.error('Error signing in', error);
    }
  };

  const listS3Objects = async () => {
    if (!user) {
      console.log('User is not authenticated');
      return;
    }
    setLoading(true);

    try {
      const idToken = user.signInUserSession.idToken.jwtToken;
      const response = await axios.post('http://localhost:3001/listS3Objects', { idToken });
      setS3Objects(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching S3 objects', error);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>S3 Bucket Listing</h1>
      {!user ? (
        <button onClick={signIn}>Sign In</button>
      ) : (
        <div>
          <h2>Welcome, {user.username}</h2>
          <button onClick={listS3Objects}>List S3 Objects</button>
        </div>
      )}
      {loading ? <p>Loading...</p> : null}
      <ul>
        {s3Objects.map((item, index) => (
          <li key={index}>{item.Key}</li>
        ))}
      </ul>
    </div>
  );
};

export default App;
