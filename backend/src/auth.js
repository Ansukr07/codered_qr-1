const jwt = require('jsonwebtoken');
const config = require('./config');
function cookieOptions() { const production=config.nodeEnv==='production'; return { httpOnly:true, secure:production, sameSite:'lax', path:'/', maxAge:86400000 }; }
function requireAuth(req,res,next) { const token=req.cookies.token; if(!token)return res.status(401).json({message:'Not authenticated'}); try{req.user=jwt.verify(token,config.jwtSecret);next();}catch{res.clearCookie('token',cookieOptions());res.status(401).json({message:'Session expired or invalid'});} }
function issueSession(res,user) { res.cookie('token',jwt.sign(user,config.jwtSecret,{expiresIn:'1d'}),cookieOptions()); }
module.exports={requireAuth,cookieOptions,issueSession};
