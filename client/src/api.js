const base=(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
export class ApiError extends Error{constructor(message,status){super(message);this.name='ApiError';this.status=status;}}
export async function api(path,options={}){
  const isForm=options.body instanceof FormData;
  let response;try{response=await fetch(`${base}${path}`,{credentials:'include',...options,headers:{...(options.body&&!isForm?{'Content-Type':'application/json'}:{}),...options.headers}});}catch{throw new ApiError('The CodeRed service is unreachable. Check your connection and try again.',0);}
  const data=await response.json().catch(()=>({}));
  if(!response.ok){if(response.status===401&&typeof window!=='undefined')window.dispatchEvent(new Event('codered:unauthorized'));throw new ApiError(data.message||`Request failed (${response.status})`,response.status);}
  return data;
}
