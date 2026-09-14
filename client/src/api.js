const base=(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
export async function api(path,options={}){
  const isForm=options.body instanceof FormData;
  const response=await fetch(`${base}${path}`,{credentials:'include',...options,headers:{...(options.body&&!isForm?{'Content-Type':'application/json'}:{}),...options.headers}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||`Request failed (${response.status})`);
  return data;
}
