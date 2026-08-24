/** The single source of truth for the 7v7 field coordinate system. */
import type {Point} from './types';
export const FIELD_WIDTH=40;export const FIELD_DEPTH=40;export const LINE_OF_SCRIMMAGE_Y=0;
export function mirror(point:Point):Point{return {x:FIELD_WIDTH-point.x,y:point.y};}
export function flip(point:Point):Point{return {x:point.x,y:-point.y};}
export function mirrorTrack(points:Point[]){return points.map(mirror);}
export function flipTrack(points:Point[]){return points.map(flip);}
