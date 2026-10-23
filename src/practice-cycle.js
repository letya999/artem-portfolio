const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
export const PRACTICE_CYCLE_SECONDS=18;
export function pressCycle(seconds){
  const cycle=Math.floor(seconds/PRACTICE_CYCLE_SECONDS),phase=(seconds%PRACTICE_CYCLE_SECONDS)/PRACTICE_CYCLE_SECONDS;
  const compression=ease((phase-.56)/.14);
  const reopening=ease((phase-.74)/.08);
  const travel=ease((phase-.82)/.13);
  return {cycle,phase,compression,closure:compression*(1-reopening),travel,
    fill:clamp(phase/.56),stage:phase<.56?'collect':phase<.70?'compress':phase<.74?'hold':phase<.82?'reopen':phase<.95?'deliver':'settled'};
}

// A word takes a curved path to the receiving palm, then becomes a small cube.
export function tagMotion(age,from,to){
 if(age<0||age>2.45)return null;
 const p=ease(age/2.2),q=1-p;
 const c1={x:from.x+(to.x-from.x)*.36,y:from.y+30};
 const c2={x:to.x-Math.min(55,Math.max(0,(to.x-from.x)*.3)),y:to.y+50};
 const x=q*q*q*from.x+3*q*q*p*c1.x+3*q*p*p*c2.x+p*p*p*to.x;
 const y=q*q*q*from.y+3*q*q*p*c1.y+3*q*p*p*c2.y+p*p*p*to.y;
 const morph=ease((age-.7)/1);
 const entrance=ease(age/.42);
 return {x,y,morph,scale:(.88+.12*entrance)*(1-.35*morph),opacity:entrance*(1-ease((age-2.1)/.35))};
}
