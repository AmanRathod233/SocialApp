import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://social-app-ku95.vercel.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // only needed if using cookies or sessions
});

export default instance;
