// frontend/src/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data from the backend
    axios.get('/api/data')  // This will automatically go to the proxy in package.json
      .then((response) => {
        setData(response.data.message);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (
    <div>
      <h1>{data ? data : 'Loading...'}</h1>
    </div>
  );
};

export default App;
