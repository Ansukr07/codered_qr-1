import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Navigate,Route,Routes} from 'react-router-dom';
import {AuthProvider,useAuth} from './auth';
import {Login} from './pages/Login';import {Dashboard} from './pages/Dashboard';import {Profile} from './pages/Profile';import {NfcProfile} from './pages/NfcProfile';import {StaffLogin} from './pages/StaffLogin';import {VolunteerNfc} from './pages/VolunteerNfc';import {Network} from './pages/Network';import {PublicProfile} from './pages/PublicProfile';import {Quests} from './pages/Quests';import {QuestReview} from './pages/QuestReview';import {AdminNfc} from './pages/AdminNfc';import {Operations} from './pages/Operations';import {AdminOverview} from './pages/AdminOverview';import {Repository} from './pages/Repository';
import {EventInfo} from './pages/EventInfo';import {Leaderboard} from './pages/Leaderboard';
import './styles.css';import './nfc.css';
const Loading=()=> <main className="center"><div className="panel">Loading session…</div></main>;
function Guard({children}){const {user,loading}=useAuth();if(loading)return <Loading/>;return user?children:<Navigate to="/login" replace/>;}
function RoleGuard({role,children}){const {user,loading}=useAuth();if(loading)return <Loading/>;const returnTo=encodeURIComponent(`${window.location.pathname}${window.location.search}`);return user?.role===role?children:<Navigate to={`/staff-login?role=${role}&returnTo=${returnTo}`} replace/>;}
function StaffGuard({children}){const {user,loading}=useAuth();if(loading)return <Loading/>;return ['volunteer','admin'].includes(user?.role)?children:<Navigate to="/staff-login" replace/>;}
function App(){return <Routes>
  <Route path="/login" element={<Login/>}/><Route path="/staff-login" element={<StaffLogin/>}/>
  <Route path="/p/:username" element={<PublicProfile/>}/><Route path="/nfc/t/:token" element={<NfcProfile/>}/>
  <Route path="/volunteer/nfc/:token" element={<RoleGuard role="volunteer"><VolunteerNfc/></RoleGuard>}/>
  <Route path="/volunteer/quests" element={<StaffGuard><QuestReview/></StaffGuard>}/>
  <Route path="/admin/nfc" element={<RoleGuard role="admin"><AdminNfc/></RoleGuard>}/>
  <Route path="/admin/overview" element={<RoleGuard role="admin"><AdminOverview/></RoleGuard>}/>
  <Route path="/" element={<Guard><Dashboard/></Guard>}/><Route path="/profile" element={<Guard><Profile/></Guard>}/><Route path="/network" element={<Guard><Network/></Guard>}/><Route path="/quests" element={<Guard><Quests/></Guard>}/>
  <Route path="/operations" element={<Guard><Operations/></Guard>}/>
  <Route path="/repository" element={<Guard><Repository/></Guard>}/>
  <Route path="/event" element={<Guard><EventInfo/></Guard>}/><Route path="/leaderboard" element={<Guard><Leaderboard/></Guard>}/>
  <Route path="*" element={<Navigate to="/" replace/>}/>
</Routes>}
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter></React.StrictMode>);
