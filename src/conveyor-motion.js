export function conveyorPose(distance,index,span){
 const x=(distance+index*(span+3)/6)%(span+3),fall=Math.max(0,x-span);
 return {x,y:-fall*fall*1.6,rotation:fall*.9};
}
