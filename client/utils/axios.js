import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:30000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // only needed if using cookies or sessions
});

export default instance;
