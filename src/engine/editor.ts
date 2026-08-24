import type {Play,Beat,Trail} from './types';import {FIELD_WIDTH} from './geometry';
const copy=(play:Play):Play=>JSON.parse(JSON.stringify(play)) as Play;
export function mirrorPlay(play:Play):Play{const next=copy(play);next.tracks.forEach(track=>track.waypoints.forEach(point=>point.x=FIELD_WIDTH-point.x));return next;}
export function flipPlay(play:Play):Play{const next=copy(play);next.tracks.forEach(track=>track.waypoints.forEach(point=>point.y=-point.y));return next;}
export function duplicatePlay(play:Play,id:string,name=play.name+' copy'):Play{const next=copy(play);next.id=id;next.name=name;return next;}
export function deletePlay(plays:Play[],id:string){return plays.filter(play=>play.id!==id);}
export function updateWaypoint(play:Play,trackId:string,index:number,t:number):Play{const next=copy(play);const track=next.tracks.find(item=>item.id===trackId);if(!track||!track.waypoints[index])return next;track.waypoints[index].t=t;track.waypoints.sort((a,b)=>a.t-b.t);return next;}
export function addBeat(play:Play,beat:Beat):Play{const next=copy(play);next.beats=[...next.beats,beat].sort((a,b)=>a.t-b.t);return next;}
export function setTrail(play:Play,trackId:string,trail:Trail):Play{const next=copy(play);const track=next.tracks.find(item=>item.id===trackId);if(track)track.trail=trail;return next;}
export function undoSnapshot(current:Play,previous:Play|undefined){return previous?copy(previous):copy(current);}
