import { neon } from '@neondatabase/serverless';
import { createHmac, timingSafeEqual } from 'node:crypto';
const initial={name:'Tavs vārds',bio:'Visas manas saites vienuviet ✨',avatar:'',theme:'rose',links:[]};
function equal(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y)}
function sign(v){return createHmac('sha256',process.env.SESSION_SECRET).update(v).digest('hex')}
function authorized(req){const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('ls_session='))?.slice(11);if(!token)return false;const [expiry,sig]=token.split('.');return Number(expiry)>Date.now()&&equal(sig||'',sign(expiry))}
function url(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');try{
if(!process.env.DATABASE_URL||!process.env.ADMIN_PASSWORD||!process.env.SESSION_SECRET)return res.status(503).json({error:'Nav konfigurēti servera mainīgie.'});
const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
if(req.method==='POST'&&body.action==='login'){if(!equal(body.password||'',process.env.ADMIN_PASSWORD))return res.status(401).json({error:'Nepareiza parole.'});const expiry=String(Date.now()+86400000);res.setHeader('Set-Cookie',`ls_session=${expiry}.${sign(expiry)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`);return res.json({ok:true})}
if(req.method==='POST'&&body.action==='logout'){res.setHeader('Set-Cookie','ls_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');return res.json({ok:true})}
if(req.method==='GET'&&req.query.session==='1')return res.json({authorized:authorized(req)});
const sql=neon(process.env.DATABASE_URL);await sql`CREATE TABLE IF NOT EXISTS linkstudio_profile (id integer PRIMARY KEY, data jsonb NOT NULL)`;
if(req.method==='GET'){const rows=await sql`SELECT data FROM linkstudio_profile WHERE id=1`;return res.json(rows[0]?.data||initial)}
if(req.method!=='PUT')return res.status(405).json({error:'Method not allowed'});if(!authorized(req))return res.status(401).json({error:'Pieslēdzies vēlreiz.'});
const p=body;const data={name:String(p.name||'').slice(0,80),bio:String(p.bio||'').slice(0,300),avatar:url(p.avatar),theme:['rose','lavender','dark','sand'].includes(p.theme)?p.theme:'rose',links:(Array.isArray(p.links)?p.links:[]).slice(0,50).map(l=>({title:String(l.title||'').slice(0,100),url:url(l.url),icon:String(l.icon||'🔗').slice(0,12),enabled:l.enabled!==false})).filter(l=>l.title&&l.url)};
await sql`INSERT INTO linkstudio_profile(id,data) VALUES(1,${JSON.stringify(data)}::jsonb) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data`;return res.json(data);
}catch(e){console.error(e);return res.status(500).json({error:'Servera kļūda.'})}}
