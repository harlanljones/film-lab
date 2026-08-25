import { useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { FIELD_DEPTH, FIELD_WIDTH, LINE_OF_SCRIMMAGE_Y } from '../engine/geometry';
import { sampleTrack } from '../engine/interpolate';
import type { PlayerTrack, Point, Trail as TrailKind, Waypoint } from '../engine/types';

export const FIELD_HEIGHT = FIELD_DEPTH * 2;

export function toFieldPoint(point: Point): Point {
  return { x: point.x, y: FIELD_DEPTH - point.y };
}

export function trailDash(trail: TrailKind = 'solid'): string | undefined {
  if (trail === 'dashed') return '1.5 1';
  if (trail === 'dotted') return '.25 1';
  return undefined;
}

type TrailProps = { points: Waypoint[]; trail?: TrailKind; side?: PlayerTrack['side']; dim?: boolean };

export function Trail({ points, trail = 'solid', side = 'offense', dim = false }: TrailProps) {
  return <polyline className={`route-trail ${side}${dim ? ' dim' : ''}`} points={points.map((point) => { const fieldPoint = toFieldPoint(point); return `${fieldPoint.x},${fieldPoint.y}`; }).join(' ')} fill="none" strokeDasharray={trailDash(trail)} aria-hidden="true" />;
}

type PlayerMarkerProps = { point: Point; role: PlayerTrack['role']; side: PlayerTrack['side']; selected?: boolean; dim?: boolean; onSelect?: () => void };

export function PlayerMarker({ point, role, side, selected = false, dim = false, onSelect }: PlayerMarkerProps) {
  const fieldPoint = toFieldPoint(point);
  const interactive = Boolean(onSelect);
  const handleKeyDown = (event: KeyboardEvent<SVGCircleElement>) => {
    if (interactive && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelect?.(); }
  };
  return <circle className={`marker ${side}${selected ? ' selected' : ''}${dim ? ' dim' : ''}`} cx={fieldPoint.x} cy={fieldPoint.y} r=".8" role={interactive ? 'button' : 'img'} tabIndex={interactive ? 0 : -1} aria-label={`${role} player`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSelect?.(); }} onKeyDown={handleKeyDown} />;
}

type Field7Props = { tracks?: PlayerTrack[]; time?: number; selectedTrackId?: string; highlightTrackIds?: string[]; onPlayerSelect?: (trackId: string) => void; onPointSelect?: (point: Point) => void; onWaypointSelect?: (trackId: string, index: number) => void; onWaypointMove?: (trackId: string, index: number, point: Point) => void; className?: string; children?: ReactNode; 'aria-label'?: string };

export function Field7({ tracks = [], time, selectedTrackId, highlightTrackIds, onPlayerSelect, onPointSelect, onWaypointSelect, onWaypointMove, className = '', children, 'aria-label': ariaLabel = '7-on-7 drill field' }: Field7Props) {
  const [dragging, setDragging] = useState<{ trackId: string; index: number } | null>(null);
  const height = Math.max(...tracks.flatMap((track) => track.waypoints.map((point) => point.t)), 0);
  const markerTime = time ?? height;
  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!onPointSelect) return;
    const box = event.currentTarget.getBoundingClientRect();
    onPointSelect({ x: (event.clientX - box.left) / box.width * FIELD_WIDTH, y: FIELD_DEPTH - (event.clientY - box.top) / box.height * FIELD_HEIGHT });
  };
  const pointFromEvent = (event: PointerEvent<SVGSVGElement>): Point => { const box = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX - box.left) / box.width * FIELD_WIDTH, y: FIELD_DEPTH - (event.clientY - box.top) / box.height * FIELD_HEIGHT }; };
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => { if (dragging && onWaypointMove) onWaypointMove(dragging.trackId, dragging.index, pointFromEvent(event)); };
  const dimOthers = highlightTrackIds !== undefined;
  const isDim = (trackId: string) => dimOthers && !highlightTrackIds.includes(trackId);
  return <svg className={`field ${className}`.trim()} viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`} preserveAspectRatio="none" role="img" aria-label={ariaLabel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => setDragging(null)}><line className="line-of-scrimmage" x1="0" x2={FIELD_WIDTH} y1={toFieldPoint({ x: 0, y: LINE_OF_SCRIMMAGE_Y }).y} y2={toFieldPoint({ x: 0, y: LINE_OF_SCRIMMAGE_Y }).y} aria-hidden="true" />{tracks.map((track) => { const dim = isDim(track.id); return <g key={track.id} className={dim ? 'dim' : undefined}><Trail points={track.waypoints} trail={track.trail} side={track.side} dim={dim} /><PlayerMarker point={sampleTrack(track, markerTime)} role={track.role} side={track.side} selected={selectedTrackId === track.id} dim={dim} onSelect={onPlayerSelect ? () => onPlayerSelect(track.id) : undefined} />{(onWaypointSelect || onWaypointMove) && track.waypoints.map((waypoint, index) => { const fieldPoint = toFieldPoint(waypoint); const selected = selectedTrackId === track.id; return <circle className={`waypoint-handle${selected ? ' selected' : ''}${dim ? ' dim' : ''}`} key={`${track.id}-${index}`} cx={fieldPoint.x} cy={fieldPoint.y} r=".45" role="button" tabIndex={0} aria-label={`${track.role} waypoint ${index + 1}`} onPointerDown={(event) => { event.stopPropagation(); setDragging({ trackId: track.id, index }); onWaypointSelect?.(track.id, index); }} onClick={(event) => { event.stopPropagation(); onWaypointSelect?.(track.id, index); }} />; })}</g>; })}{children}</svg>;
}
