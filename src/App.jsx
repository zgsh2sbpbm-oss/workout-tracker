import { useState, useEffect } from "react";

// ── Storage ───────────────────────────────────────────────────────────────────
const SK = "wt_v2";
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const TODAY_IDX = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const uid = () => Math.random().toString(36).slice(2,9);
const getWeekKey = (date = new Date()) => {
  const d = new Date(date), day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().split("T")[0];
};
const fmtWeek = (k) => new Date(k+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});

const blank = { days: [], split: { 0:null,1:null,2:null,3:null,4:null,5:null,6:null }, logs: {} };
const load = () => { try { return JSON.parse(localStorage.getItem(SK)) || blank; } catch { return blank; } };
const save = (d) => localStorage.setItem(SK, JSON.stringify(d));

// ── CSS vars & global style injected once ────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0b0f17; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
  input::placeholder { color: #3d4a5c; }
  select option { background: #161e2e; color: #e8eef6; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 2px; }
`;

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = {
  Plus:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/></svg>,
  Trash:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Edit:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  ChevR:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevL:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  X:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Grip:()=><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="7" r="1.2"/><circle cx="15" cy="7" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="17" r="1.2"/><circle cx="15" cy="17" r="1.2"/></svg>,
  // Nav icons
  HomeGrid:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  SplitCal:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="7" y1="14" x2="17" y2="14"/><line x1="7" y1="18" x2="13" y2="18"/></svg>,
  Dumbbell:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="1" y="10" width="4" height="4" rx="1"/><rect x="19" y="10" width="4" height="4" rx="1"/><rect x="4" y="8" width="3" height="8" rx="1"/><rect x="17" y="8" width="3" height="8" rx="1"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
  BarChart:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="8"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="13"/><line x1="3" y1="20" x2="21" y2="20"/></svg>,
};

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#0b0f17", surf:"#111827", surf2:"#1a2332", border:"#1e2d45",
  text:"#e8eef6", sub:"#7a8fa8", accent:"#1d6aff", accentD:"#1550cc",
  white:"#ffffff", danger:"#e63946",
  fontH:"'Barlow Condensed', sans-serif", fontB:"'Barlow', sans-serif",
};

// ── Shared primitives ─────────────────────────────────────────────────────────
const inp = (extra={}) => ({
  width:"100%", background:T.surf2, border:`1.5px solid ${T.border}`,
  borderRadius:8, color:T.text, padding:"0.65rem 0.85rem",
  fontSize:"1rem", fontFamily:T.fontB, outline:"none", ...extra
});
const Btn = ({children, onClick, variant="primary", style={}, ...props}) => {
  const base = {
    border:"none", borderRadius:8, cursor:"pointer", fontFamily:T.fontH,
    fontWeight:800, fontSize:"1rem", letterSpacing:"0.06em", padding:"0.7rem 1.25rem",
    display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem",
    transition:"opacity 0.15s, transform 0.1s", ...style,
  };
  const vars = {
    primary:{ background:T.accent, color:T.white },
    ghost:{ background:"transparent", color:T.sub, border:`1.5px solid ${T.border}` },
    danger:{ background:"transparent", color:T.danger, border:`1.5px solid ${T.danger}44` },
    white:{ background:T.white, color:T.bg },
  };
  return <button onClick={onClick} style={{...base,...vars[variant]}} {...props}>{children}</button>;
};

const Label = ({children}) => (
  <div style={{color:T.sub, fontSize:"0.72rem", fontFamily:T.fontH, fontWeight:700, letterSpacing:"0.1em", marginBottom:"0.4rem"}}>{children}</div>
);

function Modal({title, onClose, children}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{background:T.surf,borderRadius:14,width:"100%",maxWidth:460,maxHeight:"88vh",overflow:"auto",border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1rem 1.25rem",borderBottom:`1px solid ${T.border}`}}>
          <span style={{fontFamily:T.fontH,fontWeight:800,fontSize:"1.15rem",color:T.text,letterSpacing:"0.04em"}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",width:28,height:28}}><Ic.X/></button>
        </div>
        <div style={{padding:"1.25rem"}}>{children}</div>
      </div>
    </div>
  );
}

function DragList({items, onReorder, renderItem, keyFn}) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  return (
    <div>
      {items.map((item,i) => (
        <div key={keyFn(item)} draggable
          onDragStart={()=>setDragIdx(i)}
          onDragOver={(e)=>{e.preventDefault();setOverIdx(i);}}
          onDrop={()=>{
            if(dragIdx!==null&&overIdx!==null&&dragIdx!==overIdx){
              const n=[...items]; const [m]=n.splice(dragIdx,1); n.splice(overIdx,0,m); onReorder(n);
            } setDragIdx(null);setOverIdx(null);
          }}
          onDragEnd={()=>{setDragIdx(null);setOverIdx(null);}}
          style={{opacity:dragIdx===i?0.3:1, borderBottom:overIdx===i&&dragIdx!==i?`2px solid ${T.accent}`:`2px solid transparent`}}>
          {renderItem(item,i)}
        </div>
      ))}
    </div>
  );
}

// ── Progress Graph ────────────────────────────────────────────────────────────
function Graph({weekData}) {
  if(!weekData||weekData.length<1) return <div style={{textAlign:"center",color:T.sub,padding:"2rem 0",fontSize:"0.9rem"}}>No data yet</div>;
  const W=560,H=200,P={top:14,right:20,bottom:38,left:46};
  const vals=weekData.map(d=>d.maxWeight), minV=Math.min(...vals), maxV=Math.max(...vals), rng=maxV-minV||1;
  const xOf=i=>P.left+(i/Math.max(weekData.length-1,1))*(W-P.left-P.right);
  const yOf=v=>P.top+(1-(v-minV)/rng)*(H-P.top-P.bottom);
  const pathD=weekData.map((d,i)=>`${i===0?"M":"L"} ${xOf(i)} ${yOf(d.maxWeight)}`).join(" ");
  const areaD=pathD+` L ${xOf(weekData.length-1)} ${H-P.bottom} L ${xOf(0)} ${H-P.bottom} Z`;
  const ticks=Array.from({length:4},(_, i)=>minV+(rng/3)*i);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto"}}>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.accent} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={T.accent} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {ticks.map((v,i)=>(
        <g key={i}>
          <line x1={P.left} y1={yOf(v)} x2={W-P.right} y2={yOf(v)} stroke={T.border} strokeWidth={1}/>
          <text x={P.left-8} y={yOf(v)+4} textAnchor="end" fontSize={10} fill={T.sub} fontFamily={T.fontB}>{Math.round(v)}</text>
        </g>
      ))}
      {weekData.map((d,i)=>(
        <text key={i} x={xOf(i)} y={H-P.bottom+16} textAnchor="middle" fontSize={9} fill={T.sub} fontFamily={T.fontB}>{fmtWeek(d.weekKey)}</text>
      ))}
      <path d={areaD} fill="url(#ag)"/>
      <path d={pathD} fill="none" stroke={T.accent} strokeWidth={2.5} strokeLinejoin="round"/>
      {weekData.map((d,i)=>(
        <circle key={i} cx={xOf(i)} cy={yOf(d.maxWeight)} r={4} fill={T.accent} stroke={T.bg} strokeWidth={2}/>
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: HOME
// ═══════════════════════════════════════════════════════════════════════════════
function HomeTab({data,setData}) {
  const [showAddDay,setShowAddDay]=useState(false);
  const [newDayName,setNewDayName]=useState("");
  const [editDay,setEditDay]=useState(null);
  const [openDay,setOpenDay]=useState(null); // id of expanded day
  const [showAddEx,setShowAddEx]=useState(false);
  const [newEx,setNewEx]=useState({name:"",weight:"",reps:""});
  const [editEx,setEditEx]=useState(null);

  const addDay=()=>{
    if(!newDayName.trim())return;
    const d={...data,days:[...data.days,{id:uid(),name:newDayName.trim(),exercises:[]}]};
    setData(d);save(d);setNewDayName("");setShowAddDay(false);
  };
  const deleteDay=(id)=>{
    const d={...data,days:data.days.filter(x=>x.id!==id)};
    setData(d);save(d);if(openDay===id)setOpenDay(null);
  };
  const renameDay=()=>{
    if(!editDay?.name.trim())return;
    const d={...data,days:data.days.map(x=>x.id===editDay.id?{...x,name:editDay.name}:x)};
    setData(d);save(d);setEditDay(null);
  };
  const reorderDays=(newOrder)=>{ const d={...data,days:newOrder};setData(d);save(d); };

  const curDay=data.days.find(x=>x.id===openDay);

  const addEx=()=>{
    if(!newEx.name.trim())return;
    const ex={id:uid(),name:newEx.name.trim(),defaultWeight:newEx.weight?parseFloat(newEx.weight):null,defaultReps:newEx.reps?parseInt(newEx.reps):null};
    const d={...data,days:data.days.map(x=>x.id===openDay?{...x,exercises:[...x.exercises,ex]}:x)};
    setData(d);save(d);setNewEx({name:"",weight:"",reps:""});setShowAddEx(false);
  };
  const deleteEx=(exId)=>{
    const d={...data,days:data.days.map(x=>x.id===openDay?{...x,exercises:x.exercises.filter(e=>e.id!==exId)}:x)};
    setData(d);save(d);
  };
  const saveEditEx=()=>{
    if(!editEx?.name.trim())return;
    const d={...data,days:data.days.map(x=>x.id===openDay?{...x,exercises:x.exercises.map(e=>e.id===editEx.id?{...e,name:editEx.name,defaultWeight:editEx.weight?parseFloat(editEx.weight):null,defaultReps:editEx.reps?parseInt(editEx.reps):null}:e)}:x)};
    setData(d);save(d);setEditEx(null);
  };
  const reorderEx=(newOrder)=>{
    const d={...data,days:data.days.map(x=>x.id===openDay?{...x,exercises:newOrder}:x)};
    setData(d);save(d);
  };

  return (
    <div style={{padding:"1.5rem 1rem 1rem"}}>
      <div style={{fontFamily:T.fontH,fontWeight:900,fontSize:"2rem",color:T.white,letterSpacing:"0.04em",marginBottom:"0.2rem"}}>MY DAYS</div>
      <div style={{color:T.sub,fontSize:"0.85rem",fontFamily:T.fontB,marginBottom:"1.5rem"}}>Build your training days & exercises</div>

      {data.days.length===0&&<div style={{color:T.sub,textAlign:"center",padding:"3rem 0",fontSize:"0.9rem"}}>No days yet. Add one below.</div>}

      <DragList items={data.days} keyFn={d=>d.id} onReorder={reorderDays} renderItem={(day)=>(
        <div style={{background:T.surf,border:`1.5px solid ${openDay===day.id?T.accent:T.border}`,borderRadius:12,marginBottom:"0.65rem",overflow:"hidden",transition:"border-color 0.2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.9rem 1rem"}}>
            <span style={{color:T.border,width:20,cursor:"grab",flexShrink:0}}><Ic.Grip/></span>
            <button onClick={()=>setOpenDay(openDay===day.id?null:day.id)}
              style={{flex:1,background:"none",border:"none",color:T.text,textAlign:"left",cursor:"pointer",fontFamily:T.fontH,fontWeight:800,fontSize:"1.1rem",letterSpacing:"0.04em"}}>
              {day.name}
              <span style={{color:T.sub,fontSize:"0.78rem",fontFamily:T.fontB,fontWeight:400,display:"block",marginTop:"0.1rem"}}>{day.exercises.length} exercise{day.exercises.length!==1?"s":""}</span>
            </button>
            <button onClick={()=>setEditDay({id:day.id,name:day.name})} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",width:28,height:28}}><Ic.Edit/></button>
            <button onClick={()=>deleteDay(day.id)} style={{background:"none",border:"none",color:`${T.danger}66`,cursor:"pointer",width:28,height:28}}><Ic.Trash/></button>
            <span style={{color:openDay===day.id?T.accent:T.sub,width:18,transition:"transform 0.2s",transform:openDay===day.id?"rotate(90deg)":"rotate(0deg)"}}><Ic.ChevR/></span>
          </div>

          {openDay===day.id&&(
            <div style={{borderTop:`1px solid ${T.border}`,padding:"0.75rem 1rem 1rem"}}>
              {curDay?.exercises.length===0&&<div style={{color:T.sub,fontSize:"0.85rem",padding:"0.5rem 0 0.75rem"}}>No exercises yet.</div>}
              <DragList items={curDay?.exercises||[]} keyFn={e=>e.id} onReorder={reorderEx} renderItem={(ex)=>(
                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.55rem 0.25rem",borderBottom:`1px solid ${T.border}11`}}>
                  <span style={{color:T.border,width:18,cursor:"grab",flexShrink:0,fontSize:"0.8rem"}}><Ic.Grip/></span>
                  <div style={{flex:1}}>
                    <div style={{color:T.text,fontSize:"0.95rem",fontFamily:T.fontB}}>{ex.name}</div>
                    <div style={{color:T.sub,fontSize:"0.75rem"}}>{ex.defaultWeight!=null?`${ex.defaultWeight} lbs`:"—"} · {ex.defaultReps!=null?`${ex.defaultReps} reps`:"—"}</div>
                  </div>
                  <button onClick={()=>setEditEx({...ex,weight:ex.defaultWeight??"",reps:ex.defaultReps??""})} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",width:26,height:26}}><Ic.Edit/></button>
                  <button onClick={()=>deleteEx(ex.id)} style={{background:"none",border:"none",color:`${T.danger}55`,cursor:"pointer",width:26,height:26}}><Ic.Trash/></button>
                </div>
              )}/>
              <Btn variant="ghost" onClick={()=>setShowAddEx(true)} style={{width:"100%",marginTop:"0.75rem",fontSize:"0.88rem"}}>
                <span style={{width:16}}><Ic.Plus/></span> Add Exercise
              </Btn>
            </div>
          )}
        </div>
      )}/>

      <Btn onClick={()=>setShowAddDay(true)} style={{width:"100%",marginTop:"0.25rem"}}>
        <span style={{width:18}}><Ic.Plus/></span> Add Day
      </Btn>

      {showAddDay&&<Modal title="NEW DAY" onClose={()=>setShowAddDay(false)}>
        <Label>DAY NAME</Label>
        <input style={inp()} placeholder="e.g. Push, Pull, Legs…" value={newDayName} onChange={e=>setNewDayName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDay()} autoFocus/>
        <div style={{display:"flex",gap:"0.5rem",marginTop:"1rem"}}>
          <Btn onClick={addDay} style={{flex:1}}>Create</Btn>
          <Btn variant="ghost" onClick={()=>setShowAddDay(false)}>Cancel</Btn>
        </div>
      </Modal>}

      {editDay&&<Modal title="RENAME DAY" onClose={()=>setEditDay(null)}>
        <input style={inp()} value={editDay.name} onChange={e=>setEditDay({...editDay,name:e.target.value})} onKeyDown={e=>e.key==="Enter"&&renameDay()} autoFocus/>
        <div style={{display:"flex",gap:"0.5rem",marginTop:"1rem"}}>
          <Btn onClick={renameDay} style={{flex:1}}>Save</Btn>
          <Btn variant="ghost" onClick={()=>setEditDay(null)}>Cancel</Btn>
        </div>
      </Modal>}

      {showAddEx&&<Modal title="ADD EXERCISE" onClose={()=>setShowAddEx(false)}>
        <Label>EXERCISE NAME</Label>
        <input style={inp({marginBottom:"0.75rem"})} placeholder="e.g. Bench Press" value={newEx.name} onChange={e=>setNewEx({...newEx,name:e.target.value})} autoFocus/>
        <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>
          <div style={{flex:1}}><Label>DEFAULT WEIGHT (lbs)</Label><input style={inp()} type="number" placeholder="135" value={newEx.weight} onChange={e=>setNewEx({...newEx,weight:e.target.value})}/></div>
          <div style={{flex:1}}><Label>DEFAULT REPS</Label><input style={inp()} type="number" placeholder="8" value={newEx.reps} onChange={e=>setNewEx({...newEx,reps:e.target.value})}/></div>
        </div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <Btn onClick={addEx} style={{flex:1}}>Add</Btn>
          <Btn variant="ghost" onClick={()=>setShowAddEx(false)}>Cancel</Btn>
        </div>
      </Modal>}

      {editEx&&<Modal title="EDIT EXERCISE" onClose={()=>setEditEx(null)}>
        <Label>NAME</Label>
        <input style={inp({marginBottom:"0.75rem"})} value={editEx.name} onChange={e=>setEditEx({...editEx,name:e.target.value})}/>
        <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>
          <div style={{flex:1}}><Label>WEIGHT (lbs)</Label><input style={inp()} type="number" value={editEx.weight} onChange={e=>setEditEx({...editEx,weight:e.target.value})}/></div>
          <div style={{flex:1}}><Label>REPS</Label><input style={inp()} type="number" value={editEx.reps} onChange={e=>setEditEx({...editEx,reps:e.target.value})}/></div>
        </div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <Btn onClick={saveEditEx} style={{flex:1}}>Save</Btn>
          <Btn variant="ghost" onClick={()=>setEditEx(null)}>Cancel</Btn>
        </div>
      </Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: SPLIT
// ═══════════════════════════════════════════════════════════════════════════════
function SplitTab({data,setData}) {
  const setSplitDay=(dayIdx,val)=>{
    const d={...data,split:{...data.split,[dayIdx]:val||null}};
    setData(d);save(d);
  };
  const todayIdx=TODAY_IDX();
  return (
    <div style={{padding:"1.5rem 1rem 1rem"}}>
      <div style={{fontFamily:T.fontH,fontWeight:900,fontSize:"2rem",color:T.white,letterSpacing:"0.04em",marginBottom:"0.2rem"}}>WEEKLY SPLIT</div>
      <div style={{color:T.sub,fontSize:"0.85rem",fontFamily:T.fontB,marginBottom:"1.5rem"}}>Assign a training day to each day of the week</div>

      {DAYS.map((dayName,i)=>{
        const isToday=i===todayIdx;
        const assigned=data.split[i];
        return (
          <div key={i} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 1rem",background:isToday?`${T.accent}18`:T.surf,border:`1.5px solid ${isToday?T.accent:T.border}`,borderRadius:10,marginBottom:"0.5rem"}}>
            <div style={{width:90,flexShrink:0}}>
              <div style={{fontFamily:T.fontH,fontWeight:800,fontSize:"0.95rem",color:isToday?T.accent:T.text,letterSpacing:"0.04em"}}>{dayName.slice(0,3).toUpperCase()}</div>
              {isToday&&<div style={{fontSize:"0.65rem",color:T.accent,fontFamily:T.fontH,fontWeight:700,letterSpacing:"0.08em"}}>TODAY</div>}
            </div>
            <select
              style={{...inp({flex:1,appearance:"none",cursor:"pointer",color:assigned==="rest"?"#e63946":assigned?T.text:T.sub,background:T.surf2})}
              } value={assigned||""} onChange={e=>setSplitDay(i,e.target.value)}>
              <option value="">— unassigned —</option>
              <option value="rest">Rest</option>
              {data.days.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: WORKOUT
// ═══════════════════════════════════════════════════════════════════════════════
function WorkoutTab({data,setData}) {
  // phases: "select" | "reorder" | "active" | "summary" | "rest"
  const [phase,setPhase]=useState("select");
  const [mode,setMode]=useState(null); // "weekly"|"daybyday"
  const [selectedDay,setSelectedDay]=useState(null); // day object
  const [exercises,setExercises]=useState([]); // reorderable copy
  const [exIdx,setExIdx]=useState(0);
  const [sets,setSets]=useState([]);
  const [allSets,setAllSets]=useState({});
  const [weight,setWeight]=useState("");
  const [reps,setReps]=useState("");
  const [note,setNote]=useState("");
  const [showNote,setShowNote]=useState(false);

  const todayIdx=TODAY_IDX();
  const todaySplitId=data.split[todayIdx];
  const todayDay=todaySplitId&&todaySplitId!=="rest"?data.days.find(d=>d.id===todaySplitId):null;
  const isRestDay=todaySplitId==="rest";

  const startWithDay=(day)=>{
    setSelectedDay(day);
    setExercises([...day.exercises]);
    setPhase("reorder");
  };

  const beginWorkout=()=>{
    setExIdx(0);setSets([]);setAllSets({});
    prefill(exercises[0]);
    setPhase("active");
  };

  const getLastSession=(exId)=>{
    const weeks=Object.keys(data.logs||{}).sort().reverse();
    for(const wk of weeks){
      const catLogs=data.logs[wk]||{};
      for(const cid in catLogs){
        for(const s of [...catLogs[cid]].reverse()){
          if(s.exerciseId===exId&&s.sets?.length)return s;
        }
      }
    }
    return null;
  };

  const prefill=(ex)=>{
    if(!ex)return;
    const last=getLastSession(ex.id);
    if(last?.sets?.length){
      const ls=last.sets[last.sets.length-1];
      setWeight(ls.weight?.toString()??"");
      setReps(ls.reps?.toString()??"");
    } else {
      setWeight(ex.defaultWeight?.toString()??"");
      setReps(ex.defaultReps?.toString()??"");
    }
    setNote("");setShowNote(false);
  };

  useEffect(()=>{ if(phase==="active"&&exercises[exIdx])prefill(exercises[exIdx]); },[exIdx,phase]);

  const logSet=()=>{
    if(!weight&&!reps)return;
    setSets(prev=>[...prev,{weight:parseFloat(weight)||0,reps:parseInt(reps)||0,note:note.trim()}]);
    setNote("");
  };

  const nextExercise=()=>{
    const saved={...allSets,[exercises[exIdx].id]:sets};
    setAllSets(saved);
    if(exIdx+1>=exercises.length){ setAllSets(saved);setPhase("summary"); }
    else { setSets([]);setExIdx(exIdx+1); }
  };

  const finishWorkout=()=>{
    const wk=getWeekKey();
    const newEntries=Object.entries(allSets).map(([exId,exSets])=>({exerciseId:exId,date:new Date().toISOString(),sets:exSets}));
    const existing=data.logs?.[wk]?.[selectedDay.id]||[];
    const d={...data,logs:{...data.logs,[wk]:{...(data.logs?.[wk]||{}),[selectedDay.id]:[...existing,...newEntries]}}};
    setData(d);save(d);
    setPhase("select");setMode(null);setSelectedDay(null);setExercises([]);
  };

  // ── SELECT PHASE ─────────────────────────────────────────────────────────
  if(phase==="select") return (
    <div style={{padding:"1.5rem 1rem 1rem"}}>
      <div style={{fontFamily:T.fontH,fontWeight:900,fontSize:"2rem",color:T.white,letterSpacing:"0.04em",marginBottom:"0.2rem"}}>WORKOUT</div>
      <div style={{color:T.sub,fontSize:"0.85rem",fontFamily:T.fontB,marginBottom:"2rem"}}>How do you want to train today?</div>

      <div style={{display:"flex",flexDirection:"column",gap:"0.75rem",marginBottom:"2rem"}}>
        <button onClick={()=>{
          if(isRestDay){setMode("weekly");setPhase("rest");}
          else if(todayDay){setMode("weekly");startWithDay(todayDay);}
          else{setMode("weekly");setPhase("rest");} // nothing assigned
        }} style={{background:T.surf,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"1.25rem 1.25rem",cursor:"pointer",textAlign:"left",transition:"border-color 0.2s"}}>
          <div style={{fontFamily:T.fontH,fontWeight:800,fontSize:"1.2rem",color:T.text,letterSpacing:"0.04em",marginBottom:"0.3rem"}}>WEEKLY</div>
          <div style={{color:T.sub,fontSize:"0.83rem",fontFamily:T.fontB}}>
            {isRestDay?"Today is a rest day"
            :todayDay?`Today: ${todayDay.name}`
            :"No day assigned for today"}
          </div>
        </button>

        <button onClick={()=>setMode("daybyday")} style={{background:T.surf,border:`1.5px solid ${mode==="daybyday"?T.accent:T.border}`,borderRadius:12,padding:"1.25rem 1.25rem",cursor:"pointer",textAlign:"left"}}>
          <div style={{fontFamily:T.fontH,fontWeight:800,fontSize:"1.2rem",color:T.text,letterSpacing:"0.04em",marginBottom:"0.3rem"}}>DAY BY DAY</div>
          <div style={{color:T.sub,fontSize:"0.83rem",fontFamily:T.fontB}}>Pick any training day manually</div>
        </button>
      </div>

      {mode==="daybyday"&&(
        <div>
          <Label>SELECT DAY</Label>
          {data.days.length===0&&<div style={{color:T.sub,fontSize:"0.88rem",padding:"1rem 0"}}>No days created yet. Add them in the Home tab.</div>}
          {data.days.map(day=>(
            <button key={day.id} onClick={()=>startWithDay(day)}
              style={{width:"100%",background:T.surf2,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"0.9rem 1rem",marginBottom:"0.5rem",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontFamily:T.fontH,fontWeight:800,fontSize:"1rem",color:T.text,letterSpacing:"0.04em"}}>{day.name}</div>
                <div style={{color:T.sub,fontSize:"0.75rem"}}>{day.exercises.length} exercises</div>
              </div>
              <span style={{color:T.accent,width:18}}><Ic.ChevR/></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── REST DAY ──────────────────────────────────────────────────────────────
  if(phase==="rest") return (
    <div style={{padding:"1.5rem 1rem",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:"1.5rem",textAlign:"center"}}>
      <div style={{fontSize:"3rem"}}>😴</div>
      <div style={{fontFamily:T.fontH,fontWeight:900,fontSize:"2rem",color:T.white,letterSpacing:"0.06em"}}>REST DAY</div>
      <div style={{color:T.sub,fontSize:"0.95rem",fontFamily:T.fontB,maxWidth:280}}>{DAYS[todayIdx]} is scheduled as a rest day. Recovery is part of the program.</div>
      <Btn variant="ghost" onClick={()=>{setPhase("select");setMode(null);}}>Back</Btn>
    </div>
  );

  // ── REORDER PHASE ─────────────────────────────────────────────────────────
  if(phase==="reorder") return (
    <div style={{padding:"1.5rem 1rem 1rem"}}>
      <div style={{fontFamily:T.fontH,fontWeight:900,fontSize:"2rem",color:T.white,letterSpacing:"0.04em",marginBottom:"0.2rem"}}>{selectedDay?.name?.toUpperCase()}</div>
      <div style={{color:T.sub,fontSize:"0.85rem",fontFamily:T.fontB,marginBottom:"1.5rem"}}>Drag to reorder exercises before starting</div>

      <DragList items={exercises} keyFn={e=>e.id} onReorder={setExercises} renderItem={(ex,i)=>(
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.85rem 1rem",background:T.surf,border:`1.5px solid ${T.border}`,borderRadius:10,marginBottom:"0.5rem"}}>
          <span style={{color:T.border,width:20,cursor:"grab"}}><Ic.Grip/></span>
          <div style={{flex:1}}>
            <div style={{fontFamily:T.fontH,fontWeight:700,fontSize:"1rem",color:T.text,letterSpacing:"0.03em"}}>{ex.name}</div>
            <div style={{color:T.sub,fontSize:"0.75rem"}}>{ex.defaultWeight!=null?`${ex.defaultWeight} lbs · ${ex.defaultReps} reps`:""}</div>
          </div>
          <div style={{fontFamily:T.fontH,fontWeight:800,fontSize:"1.2rem",color:T.border}}>#{i+1}</div>
        </div>
      )}/>

      <Btn onClick={beginWorkout} style={{width:"100%",marginTop:"1rem",fontSize:"1.05rem",padding:"0.9rem"}}>
        Start Workout <span style={{width:18}}><Ic.ChevR/></span>
      </Btn>
      <Btn variant="ghost" onClick={()=>{setPhase("select");setMode(null);}} style={{width:"100%",marginTop:"0.5rem"}}>Cancel</Btn>
    </div>
  );

  // ── ACTIVE PHASE ──────────────────────────────────────────────────────────
  if(phase==="active"){
    const ex=exercises[exIdx];
    const last=getLastSession(ex.id);
    return (
      <div style={{padding:"1.5rem 1rem 1rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"}}>
          <span style={{color:T.sub,fontSize:"0.78rem",fontFamily:T.fontH,fontWeight:700,letterSpacing:"0.08em"}}>{selectedDay?.name?.toUpperCase()}</span>
          <span style={{color:T.sub,fontSize:"0.78rem",fontFamily:T.fontH,fontWeight:700}}>{exIdx+1} / {exercises.length}</span>
        </div>
        <div style={{height:3,background:T.border,borderRadius:2,marginBottom:"1.5rem"}}>
          <div style={{height:"100%",background:T.accent,borderRadius:2,width:`${((exIdx+1)/exercises.length)*100}%`,transition:"width 0.3s"}}/>
        </div>

        <div style={{fontFamily:T.fontH,fontWeight:900,fontSize:"1.8rem",color:T.white,letterSpacing:"0.04em",marginBottom:"0.75rem",lineHeight:1.1}}>{ex.name.toUpperCase()}</div>

        {last?(
          <div style={{background:`${T.accent}15`,border:`1px solid ${T.accent}33`,borderRadius:8,padding:"0.6rem 0.9rem",marginBottom:"1.25rem"}}>
            <div style={{fontSize:"0.7rem",fontFamily:T.fontH,fontWeight:700,color:T.accent,letterSpacing:"0.1em",marginBottom:"0.2rem"}}>LAST SESSION</div>
            <div style={{color:"#7aabff",fontSize:"0.85rem",fontFamily:T.fontB}}>{last.sets.map(s=>`${s.weight}lb×${s.reps}`).join("  ·  ")}</div>
          </div>
        ):ex.defaultWeight!=null?(
          <div style={{background:`${T.accent}15`,border:`1px solid ${T.accent}33`,borderRadius:8,padding:"0.6rem 0.9rem",marginBottom:"1.25rem"}}>
            <div style={{fontSize:"0.7rem",fontFamily:T.fontH,fontWeight:700,color:T.accent,letterSpacing:"0.1em",marginBottom:"0.2rem"}}>STARTING WEIGHT</div>
            <div style={{color:"#7aabff",fontSize:"0.85rem",fontFamily:T.fontB}}>{ex.defaultWeight} lbs · {ex.defaultReps} reps</div>
          </div>
        ):<div style={{marginBottom:"1.25rem"}}/>}

        {sets.length>0&&(
          <div style={{marginBottom:"1rem"}}>
            {sets.map((s,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.45rem 0.75rem",background:T.surf2,borderRadius:7,marginBottom:"0.3rem",border:`1px solid ${T.border}`}}>
                <span style={{color:T.sub,fontSize:"0.8rem",fontFamily:T.fontH,fontWeight:700}}>SET {i+1}</span>
                <span style={{color:T.white,fontSize:"0.9rem",fontFamily:T.fontB,fontWeight:600}}>{s.weight} lbs × {s.reps} reps</span>
                {s.note&&<span style={{color:T.sub,fontSize:"0.72rem",maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.note}</span>}
              </div>
            ))}
          </div>
        )}

        <div style={{display:"flex",gap:"0.75rem",marginBottom:"0.75rem"}}>
          <div style={{flex:1}}>
            <Label>WEIGHT (lbs)</Label>
            <input style={inp({fontSize:"1.4rem",textAlign:"center",padding:"0.8rem"})} type="number" value={weight} onChange={e=>setWeight(e.target.value)}/>
          </div>
          <div style={{flex:1}}>
            <Label>REPS</Label>
            <input style={inp({fontSize:"1.4rem",textAlign:"center",padding:"0.8rem"})} type="number" value={reps} onChange={e=>setReps(e.target.value)}/>
          </div>
        </div>

        {showNote?(
          <textarea style={{...inp({resize:"none",height:64,marginBottom:"0.75rem",fontSize:"0.9rem"})}} placeholder="Note — gym, form, how it felt…" value={note} onChange={e=>setNote(e.target.value)}/>
        ):(
          <button onClick={()=>setShowNote(true)} style={{background:"none",border:`1px dashed ${T.border}`,borderRadius:8,width:"100%",padding:"0.55rem",color:T.sub,fontSize:"0.82rem",cursor:"pointer",marginBottom:"0.75rem",fontFamily:T.fontB}}>+ Add note</button>
        )}

        <Btn onClick={logSet} style={{width:"100%",marginBottom:"0.6rem",padding:"0.85rem",fontSize:"1.05rem"}}>Log Set</Btn>
        <Btn variant="ghost" onClick={nextExercise} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}>
          {exIdx+1>=exercises.length?"Finish Workout":"Next Exercise"} <span style={{width:16}}><Ic.ChevR/></span>
        </Btn>
      </div>
    );
  }

  // ── SUMMARY PHASE ─────────────────────────────────────────────────────────
  if(phase==="summary") return (
    <div style={{padding:"1.5rem 1rem 1rem"}}>
      <div style={{fontFamily:T.fontH,fontWeight:900,fontSize:"2rem",color:T.white,letterSpacing:"0.04em",marginBottom:"0.2rem"}}>DONE</div>
      <div style={{color:T.sub,fontSize:"0.85rem",fontFamily:T.fontB,marginBottom:"1.5rem"}}>{selectedDay?.name} — {new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>

      {exercises.map(ex=>{
        const exSets=allSets[ex.id]||[];
        if(!exSets.length)return null;
        return (
          <div key={ex.id} style={{background:T.surf,border:`1.5px solid ${T.border}`,borderRadius:10,marginBottom:"0.65rem",padding:"1rem"}}>
            <div style={{fontFamily:T.fontH,fontWeight:800,fontSize:"1rem",color:T.text,letterSpacing:"0.04em",marginBottom:"0.5rem"}}>{ex.name}</div>
            {exSets.map((s,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"0.3rem 0",borderBottom:i<exSets.length-1?`1px solid ${T.border}11`:"none"}}>
                <span style={{color:T.sub,fontSize:"0.82rem",fontFamily:T.fontH,fontWeight:700}}>SET {i+1}</span>
                <span style={{color:T.text,fontSize:"0.88rem"}}>{s.weight} lbs × {s.reps} reps</span>
                {s.note&&<span style={{color:T.sub,fontSize:"0.75rem"}}>{s.note}</span>}
              </div>
            ))}
          </div>
        );
      })}

      <Btn onClick={finishWorkout} style={{width:"100%",marginTop:"0.5rem",padding:"0.9rem",fontSize:"1.05rem"}}>Save & Finish</Btn>
    </div>
  );

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: STATS
// ═══════════════════════════════════════════════════════════════════════════════
function StatsTab({data}) {
  const [selEx,setSelEx]=useState(null);
  const [selWeek,setSelWeek]=useState(null);
  const allEx=data.days.flatMap(d=>d.exercises.map(e=>({...e,dayName:d.name,dayId:d.id})));

  const weekData=(exId)=>{
    const weeks=Object.keys(data.logs||{}).sort();
    return weeks.reduce((acc,wk)=>{
      let max=0;
      for(const cid in data.logs[wk]){
        for(const entry of data.logs[wk][cid]){
          if(entry.exerciseId===exId) for(const s of entry.sets||[]) if(s.weight>max)max=s.weight;
        }
      }
      if(max>0)acc.push({weekKey:wk,maxWeight:max});
      return acc;
    },[]);
  };

  const rawLog=(exId,wk)=>{
    const catLogs=data.logs?.[wk]||{};
    return Object.values(catLogs).flat().filter(e=>e.exerciseId===exId);
  };

  const wd=selEx?weekData(selEx.id):[];
  const raw=selEx&&selWeek?rawLog(selEx.id,selWeek):[];

  return (
    <div style={{padding:"1.5rem 1rem 1rem"}}>
      <div style={{fontFamily:T.fontH,fontWeight:900,fontSize:"2rem",color:T.white,letterSpacing:"0.04em",marginBottom:"0.2rem"}}>PROGRESS</div>
      <div style={{color:T.sub,fontSize:"0.85rem",fontFamily:T.fontB,marginBottom:"1.5rem"}}>Track your strength over time</div>

      <Label>SELECT EXERCISE</Label>
      <select style={{...inp({appearance:"none",marginBottom:"1.25rem",cursor:"pointer"})}} value={selEx?.id||""} onChange={e=>{setSelEx(allEx.find(x=>x.id===e.target.value)||null);setSelWeek(null);}}>
        <option value="">— Choose an exercise —</option>
        {data.days.map(d=>(
          <optgroup key={d.id} label={d.name}>
            {d.exercises.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
          </optgroup>
        ))}
      </select>

      {selEx&&(
        <>
          <div style={{background:T.surf,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"1rem",marginBottom:"1rem"}}>
            <Label>MAX WEIGHT BY WEEK</Label>
            <Graph weekData={wd}/>
          </div>

          {wd.length>0&&(
            <>
              <Label>WEEKLY LOG</Label>
              {wd.map(w=>(
                <button key={w.weekKey} onClick={()=>setSelWeek(selWeek===w.weekKey?null:w.weekKey)}
                  style={{width:"100%",background:selWeek===w.weekKey?`${T.accent}18`:T.surf,border:`1.5px solid ${selWeek===w.weekKey?T.accent:T.border}`,borderRadius:9,padding:"0.7rem 1rem",marginBottom:"0.4rem",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                  <span style={{color:T.text,fontSize:"0.9rem",fontFamily:T.fontB}}>Week of {fmtWeek(w.weekKey)}</span>
                  <span style={{color:T.accent,fontFamily:T.fontH,fontWeight:800,fontSize:"0.95rem"}}>{w.maxWeight} lbs</span>
                </button>
              ))}

              {selWeek&&raw.length>0&&(
                <div style={{background:T.surf,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"1rem",marginTop:"0.25rem"}}>
                  <Label>RAW DATA — {fmtWeek(selWeek)}</Label>
                  {raw.map((entry,ei)=>(
                    <div key={ei} style={{marginBottom:"0.75rem"}}>
                      <div style={{color:T.sub,fontSize:"0.75rem",marginBottom:"0.35rem",fontFamily:T.fontB}}>{new Date(entry.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                      {entry.sets?.map((s,si)=>(
                        <div key={si} style={{display:"flex",justifyContent:"space-between",padding:"0.35rem 0.6rem",background:T.surf2,borderRadius:6,marginBottom:"0.2rem",fontSize:"0.85rem"}}>
                          <span style={{color:T.sub,fontFamily:T.fontH,fontWeight:700}}>SET {si+1}</span>
                          <span style={{color:T.text}}>{s.weight} lbs × {s.reps} reps</span>
                          {s.note&&<span style={{color:T.sub,fontSize:"0.75rem"}}>{s.note}</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {wd.length===0&&<div style={{color:T.sub,textAlign:"center",padding:"2rem 0",fontSize:"0.88rem"}}>No data logged for {selEx.name} yet.</div>}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [data,setData]=useState(()=>load());
  const [tab,setTab]=useState("home");

  useEffect(()=>{
    if(!document.getElementById("wt-global-css")){
      const s=document.createElement("style");s.id="wt-global-css";s.textContent=GLOBAL_CSS;
      document.head.appendChild(s);
    }
  },[]);

  const NAV=[
    {id:"home",label:"HOME",icon:<Ic.HomeGrid/>},
    {id:"split",label:"SPLIT",icon:<Ic.SplitCal/>},
    {id:"workout",label:"WORKOUT",icon:<Ic.Dumbbell/>},
    {id:"stats",label:"STATS",icon:<Ic.BarChart/>},
  ];

  return (
    <div style={{background:T.bg,color:T.text,minHeight:"100vh",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",fontFamily:T.fontB,position:"relative"}}>
      <div style={{flex:1,overflowY:"auto",paddingBottom:"5rem"}}>
        {tab==="home"&&<HomeTab data={data} setData={setData}/>}
        {tab==="split"&&<SplitTab data={data} setData={setData}/>}
        {tab==="workout"&&<WorkoutTab data={data} setData={setData}/>}
        {tab==="stats"&&<StatsTab data={data}/>}
      </div>

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.surf,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-around",padding:"0.5rem 0 0.85rem",zIndex:200}}>
        {NAV.map(n=>{
          const active=tab===n.id;
          const isCenter=n.id==="workout";
          return (
            <button key={n.id} onClick={()=>setTab(n.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.2rem",padding:isCenter?"0":"0.15rem 1rem",position:"relative"}}>
              {isCenter?(
                <div style={{width:52,height:52,borderRadius:"50%",background:active?T.accent:T.surf2,border:`2px solid ${active?T.accent:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:active?T.white:T.sub,marginTop:-20,boxShadow:active?"0 0 20px #1d6aff44":"none",transition:"all 0.2s"}}>
                  <span style={{width:24,height:24}}>{n.icon}</span>
                </div>
              ):(
                <span style={{width:22,height:22,color:active?T.accent:T.sub,transition:"color 0.2s"}}>{n.icon}</span>
              )}
              <span style={{fontSize:"0.62rem",fontFamily:T.fontH,fontWeight:800,letterSpacing:"0.1em",color:active?T.accent:T.sub,transition:"color 0.2s"}}>{n.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
