const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
export const PRACTICE_CYCLE_SECONDS=27.5;
export function pressCycle(seconds){
  const cycle=Math.floor(seconds/PRACTICE_CYCLE_SECONDS),age=seconds%PRACTICE_CYCLE_SECONDS,phase=age/PRACTICE_CYCLE_SECONDS;
  const compression=ease((age-20)/2);
  const reopening=ease((age-23)/1.2);
  const travel=ease((age-24.5)/1.5);
  const exit=ease((age-27)/.5);
  return {cycle,phase,compression,closure:compression*(1-reopening),travel,exit,
    fill:clamp(age/20),stage:age<20?'collect':age<22?'compress':age<23?'hold':age<24.5?'reopen':age<26?'deliver':age<27?'settled':'exit'};
}

// A word takes a curved path to the receiving palm, then becomes a small cube.
export function tagMotion(age,from,to){
 if(age<0||age>3)return null;
 const p=ease(age/2.2),q=1-p;
 const c1={x:from.x+(to.x-from.x)*.36,y:from.y+30};
 const c2={x:to.x-Math.min(55,Math.max(0,(to.x-from.x)*.3)),y:to.y+50};
 const x=q*q*q*from.x+3*q*q*p*c1.x+3*q*p*p*c2.x+p*p*p*to.x;
 const y=q*q*q*from.y+3*q*q*p*c1.y+3*q*p*p*c2.y+p*p*p*to.y;
 const morph=ease((age-1.4)/1);
 const entrance=ease(age/.42);
 return {x,y,morph,scale:(.88+.12*entrance)*(1-.35*morph),opacity:entrance*(1-ease((age-2.65)/.35))};
}
