import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Navigate,Route,Routes} from 'react-router-dom';
import {AuthProvider,useAuth} from './auth';
import {Login} from './pages/Login';import {Dashboard} from './pages/Dashboard';import {Profile} from './pages/Profile';import {NfcProfile} from './pages/NfcProfile';import {StaffLogin} from './pages/StaffLogin';import {VolunteerNfc} from './pages/VolunteerNfc';import {Network} from './pages/Network';import {PublicProfile} from './pages/PublicProfile';import {Quests} from './pages/Quests';import {QuestReview} from './pages/QuestReview';import {AdminNfc} from './pages/AdminNfc';import {Operations} from './pages/Operations';import {AdminOverview} from './pages/AdminOverview';import {Repository} from './pages/Repository';
import {EventInfo} from './pages/EventInfo';import {Leaderboard} from './pages/Leaderboard';
import {StaffManagement} from './pages/StaffManagement';
import {ParticipantDetail} from './pages/ParticipantDetail';
import {ResourceTracking} from './pages/ResourceTracking';
import {RepositoryAudit} from './pages/RepositoryAudit';
import {QrScanner} from './pages/QrScanner';
import {ParticipantRoster} from './pages/ParticipantRoster';
import {CampusMap} from './pages/CampusMap';
import './styles.css';import './nfc.css';import './map.css';
const Loading=()=> <main className="center"><div className="panel">Loading session…</div></main>;
function Guard({children}){const {user,loading}=useAuth();if(loading)return <Loading/>;return user?children:<Navigate to="/login" replace/>;}
function RoleGuard({role,children}){const {user,loading}=useAuth();if(loading)return <Loading/>;const returnTo=encodeURIComponent(`${window.location.pathname}${window.location.search}`);return user?.role===role?children:<Navigate to={`/staff-login?role=${role}&returnTo=${returnTo}`} replace/>;}
function StaffGuard({children}){const {user,loading}=useAuth();if(loading)return <Loading/>;return ['volunteer','admin'].includes(user?.role)?children:<Navigate to="/staff-login" replace/>;}
function ParticipantGuard({children,allowOnboarding=false}){const {user,loading}=useAuth();if(loading)return <Loading/>;if(user?.role!=='participant')return <Navigate to="/login" replace/>;if(!allowOnboarding&&!user.onboardingCompleted)return <Navigate to="/profile" replace/>;return children;}
function App(){return <Routes>
  <Route path="/login" element={<Login/>}/><Route path="/staff-login" element={<StaffLogin/>}/>
  <Route path="/p/:username" element={<PublicProfile/>}/><Route path="/nfc/t/:token" element={<NfcProfile/>}/>
  <Route path="/volunteer/nfc/:token" element={<RoleGuard role="volunteer"><VolunteerNfc/></RoleGuard>}/>
  <Route path="/volunteer/quests" element={<StaffGuard><QuestReview/></StaffGuard>}/>
  <Route path="/staff/resources" element={<StaffGuard><ResourceTracking/></StaffGuard>}/>
  <Route path="/admin/nfc" element={<RoleGuard role="admin"><AdminNfc/></RoleGuard>}/>
  <Route path="/admin/overview" element={<RoleGuard role="admin"><AdminOverview/></RoleGuard>}/>
  <Route path="/admin/staff" element={<RoleGuard role="admin"><StaffManagement/></RoleGuard>}/>
  <Route path="/admin/participants/:id" element={<RoleGuard role="admin"><ParticipantDetail/></RoleGuard>}/>
  <Route path="/admin/repositories" element={<RoleGuard role="admin"><RepositoryAudit/></RoleGuard>}/>
  <Route path="/admin/participants" element={<RoleGuard role="admin"><ParticipantRoster/></RoleGuard>}/>
  <Route path="/" element={<Guard><Dashboard/></Guard>}/><Route path="/profile" element={<ParticipantGuard allowOnboarding><Profile/></ParticipantGuard>}/><Route path="/network" element={<ParticipantGuard><Network/></ParticipantGuard>}/><Route path="/quests" element={<ParticipantGuard><Quests/></ParticipantGuard>}/>
  <Route path="/operations" element={<Guard><Operations/></Guard>}/>
  <Route path="/repository" element={<ParticipantGuard><Repository/></ParticipantGuard>}/>
  <Route path="/event" element={<ParticipantGuard><EventInfo/></ParticipantGuard>}/><Route path="/leaderboard" element={<ParticipantGuard><Leaderboard/></ParticipantGuard>}/>
  <Route path="/campus-map" element={<ParticipantGuard><CampusMap/></ParticipantGuard>}/>
  <Route path="/scan" element={<ParticipantGuard><QrScanner/></ParticipantGuard>}/>
  <Route path="*" element={<Navigate to="/" replace/>}/>
</Routes>}
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter></React.StrictMode>);
