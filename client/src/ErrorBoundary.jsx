import {Component} from 'react';

export class ErrorBoundary extends Component{
  constructor(props){super(props);this.state={failed:false};}
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error,details){console.error('Portal rendering failed',error,details);}
  render(){if(!this.state.failed)return this.props.children;return <main className="center"><section className="panel login-card" role="alert"><p className="eyebrow">PORTAL ERROR</p><h1>This screen could not load.</h1><p>Your account and event data are safe. Reload the portal to try again.</p><button onClick={()=>window.location.reload()}>RELOAD PORTAL</button><p><a href="/">Return to the home screen</a></p></section></main>;}
}
