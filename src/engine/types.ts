/** Ported from harlanljones/scheme-db (MIT). */
export type Point={x:number;y:number};
export type Waypoint=Point&{t:number};
export type OffenseRole='qb'|'c'|'rb'|'wr'|'slot';
export type DefenseRole='rusher'|'lb'|'db'|'s';
export type Trail='solid'|'dashed'|'dotted';
export type PlayerTrack={id:string;side:'offense'|'defense';role:OffenseRole|DefenseRole;waypoints:Waypoint[];trail?:Trail};
export type Beat={t:number;title:string;description?:string;focus?:string[]};
export type CoachingSummary={motive:string;keyDefender:string;whyItWorks:string;counter:string};
export type Play={id:string;name:string;duration:number;category:string;defenseLook:string;concept?:string;assignments?:Record<string,string>;tags:string[];notes:string;tracks:PlayerTrack[];beats:Beat[];summary:CoachingSummary};
export type FormationTemplate={id:string;name:string;side:'offense'|'defense';look:string;tracks:PlayerTrack[]};
export type ScriptItem={playId:string;reps?:number};
export type RosterPlayer={id:string;name:string;number?:number;role?:OffenseRole};
