/** Ported from harlanljones/scheme-db (MIT). */
import type {Beat} from './types';
export function activeBeatIndex(beats:Beat[],t:number):number { let result=-1;for(let i=0;i<beats.length;i++){if(beats[i].t<=t)result=i;else break;}return result; }
export function isFocused(beat:Beat|undefined,id:string){return beat?.focus?.includes(id)??false;}
