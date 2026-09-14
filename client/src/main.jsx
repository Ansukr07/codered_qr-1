import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Navigate,Route,Routes} from 'react-router-dom';
import {AuthProvider,useAuth} from './auth';
import {Login} from './pages/Login';
import {Dashboard} from './pages/Dashboard';
import {Profile} from './pages/Profile';
import {NfcProfile} from './pages/NfcProfile';
import './styles.css';
import './nfc.css';
function Guard({children}){const {user,loading}=useAuth();if(loading)return <main className="center"><div className="panel">Loading session…</div></main>;return user?children:<Navigate to="/login" replace/>;}
function App(){return <Routes><Route path="/login" element={<Login/>}/><Route path="/nfc/t/:token" element={<NfcProfile/>}/><Route path="/" element={<Guard><Dashboard/></Guard>}/><Route path="/profile" element={<Guard><Profile/></Guard>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter></React.StrictMode>);
