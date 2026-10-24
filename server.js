import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import {fileURLToPath} from 'url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
app.use(express.json({limit:'40kb'}));
app.use(express.static(path.join(__dirname,'public')));
const client=process.env.OPENAI_API_KEY?new OpenAI({apiKey:process.env.OPENAI_API_KEY}):null;
const SYSTEM=`You are BlockForge, a Minecraft Bedrock build planner. Return only JSON:
{"title":"...","summary":"...","blocks":[{"x":0,"y":0,"z":0,"block":"stone"}],"rooms":["..."],"materials":[{"block":"stone","count":10}]}
Generate a coherent structure from the user's Turkish request. Coordinates relative to origin: x,z -16..16; y -8..20. Maximum 900 unique blocks. Use common vanilla Bedrock IDs only, no commands or entities in AI JSON. Keep walkways and rooms navigable. For underground bases, include a surface entrance and below-ground rooms. Avoid world-wide destructive actions.`;
app.post('/api/build',async(req,res)=>{
 try{
  if(!client)return res.status(503).json({error:'Sunucu API anahtarı ayarlanmamış. Yayına almadan önce hosting ortamında OPENAI_API_KEY eklenmeli.'});
  const prompt=String(req.body.prompt||'').trim().slice(0,2200);
  if(prompt.length<4)return res.status(400).json({error:'Lütfen daha ayrıntılı bir yapı isteği yaz.'});
  const origin={x:clamp(req.body.origin?.x,0,-30000000,30000000),y:clamp(req.body.origin?.y,64,-64,320),z:clamp(req.body.origin?.z,0,-30000000,30000000)};
  const response=await client.chat.completions.create({
   model:process.env.OPENAI_MODEL||'gpt-4o-mini',
   response_format:{type:'json_object'},
   messages:[{role:'system',content:SYSTEM},{role:'user',content:`Prompt: ${prompt}\nSeed: ${String(req.body.seed||'not specified').slice(0,100)} (reference only; do not claim to inspect terrain)\nOrigin: ${JSON.stringify(origin)}`}],
   max_tokens:6500
  });
  const plan=JSON.parse(response.choices?.[0]?.message?.content||'{}');
  if(!Array.isArray(plan.blocks))throw new Error('Missing blocks');
  const seen=new Set(),allowed=new Set(['stone','cobblestone','deepslate','deepslate_bricks','polished_andesite','andesite','glass','glass_pane','iron_block','iron_bars','sea_lantern','oak_planks','oak_log','oak_door','ladder','redstone_lamp','obsidian','crafting_table','chest','glowstone','quartz_block','stone_bricks','mossy_stone_bricks','smooth_stone','polished_deepslate','spruce_planks','spruce_door','barrel','furnace','blast_furnace','lantern','torch','water','air','white_concrete','gray_concrete','black_concrete','iron_door','lever','stone_button','redstone_block','bookshelf','bedrock','netherite_block','diamond_block','gold_block','emerald_block','anvil','enchanting_table','brewing_stand','end_rod']);
  plan.blocks=plan.blocks.slice(0,900).filter(b=>{
   b.x=clamp(b.x,0,-16,16);b.y=clamp(b.y,0,-8,20);b.z=clamp(b.z,0,-16,16);
   let id=String(b.block||'stone').toLowerCase().replace(/^minecraft:/,'').replace(/[^a-z0-9_]/g,'');
   if(!allowed.has(id))id='stone';b.block='minecraft:'+id;
   const k=`${b.x},${b.y},${b.z}`;if(seen.has(k))return false;seen.add(k);return true;
  });
  if(!plan.blocks.length)throw new Error('No blocks');
  res.json({title:String(plan.title||'AI Yapısı').slice(0,80),summary:String(plan.summary||''),blocks:plan.blocks,rooms:Array.isArray(plan.rooms)?plan.rooms.slice(0,12):[],materials:Array.isArray(plan.materials)?plan.materials.slice(0,30):[],origin,seed:String(req.body.seed||'').slice(0,100)});
 }catch(e){console.error(e);res.status(500).json({error:'Yapı üretilemedi. API modelini, anahtarını veya bağlantını kontrol edip tekrar dene.'})}
});
function clamp(v,d,min,max){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):d}
app.get('/api/health',(_,res)=>res.json({ok:true,apiConfigured:!!client}));
app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('BlockForge AI web server running'));
