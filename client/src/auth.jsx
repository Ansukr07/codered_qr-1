import {createContext,useContext,useEffect,useState} from 'react';
import {api} from './api';
const AuthContext=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(null);const [loading,setLoading]=useState(true);async function refresh(){try{setUser((await api('/api/auth/me')).user);}catch{setUser(null);}finally{setLoading(false);}}useEffect(()=>{const expired=()=>setUser(null);window.addEventListener('codered:unauthorized',expired);refresh();return()=>window.removeEventListener('codered:unauthorized',expired);},[]);async function logout(){try{await api('/api/auth/logout',{method:'POST'});}finally{setUser(null);}}return <AuthContext.Provider value={{user,loading,setUser,refresh,logout}}>{children}</AuthContext.Provider>}
export const useAuth=()=>useContext(AuthContext);
