import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import '../css/peopleList.css';
import { RESIDENTS } from '../character/residents';
import { getThumb } from '../character/thumbnails';
import { live } from '../world/store';
import { drawIslandBase, mapProjection } from '../world/islandMap';

// 주민 화면 (/people): 왼쪽 집 모양 아이콘 목록, 오른쪽 고른 주민 소개 + 지금 섬 어디에 있는지 지도.
// 디자인 참고: docs/reference/peoplelist.jpeg

const MAP_W = 300;
const PROJ = mapProjection(MAP_W, 14);
const ROWS = 'ABCDEF';
const COLS = 5;

// 주민 사진 (게임 모델을 그대로 찍은 것)
function Portrait({ resident, view = 'portrait', className }) {
  const key = `resident|${resident.id}|${view}`;
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    const ready = getThumb(key, resident, view, (u) => { if (alive) setUrl(u); });
    if (ready) setUrl(ready);
    return () => { alive = false; };
  }, [key, resident, view]);
  return url
    ? <img className={className} src={url} alt="" draggable="false" />
    : <span className={clsx(className, 'plPortraitLoading')} aria-hidden="true" />;
}

// 둥근 오각형 집 모양
const HOUSE = 'M50 5 Q53 5 56 7.5 L93 39 Q97 43 94 47 Q92 49 89 49 L89 87 Q89 95 81 95 L19 95 Q11 95 11 87 L11 49 Q8 49 6 47 Q3 43 7 39 L44 7.5 Q47 5 50 5 Z';

function HouseButton({ resident, selected, onPick }) {
  return (
    <button
      type="button"
      className={clsx('plHouse', selected && 'isSelected')}
      aria-pressed={selected}
      aria-label={`${resident.name} (${resident.type})`}
      onClick={onPick}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path d={HOUSE} />
      </svg>
      <Portrait resident={resident} className="plHouseFace" />
    </button>
  );
}

// 섬 지도 + 주민 위치 핀 (섬은 한 번만 그리고, 핀은 DOM으로 얹는다)
function ResidentMap({ selectedId, onPick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = PROJ.width * dpr;
    canvas.height = PROJ.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawIslandBase(ctx, PROJ, { radius: 0, sea: '#9EDFE0', coastWidth: 5 });
  }, []);

  const where = new Map(live.residents.map(r => [r.def.id, r]));
  return (
    <div className="plMap" style={{ width: PROJ.width, height: PROJ.height }}>
      <canvas ref={canvasRef} style={{ width: PROJ.width, height: PROJ.height }} role="img" aria-label="주민들이 있는 곳" />
      <div className="plMapGrid" aria-hidden="true">
        {ROWS.split('').map((r, i) => (
          <span key={r} className="plMapRow" style={{ top: `${((i + 0.5) / ROWS.length) * 100}%` }}>{r}</span>
        ))}
        {Array.from({ length: COLS }, (_, i) => (
          <span key={i} className="plMapCol" style={{ left: `${((i + 0.5) / COLS) * 100}%` }}>{i + 1}</span>
        ))}
      </div>
      {RESIDENTS.map(res => {
        const r = where.get(res.id);
        if (!r) return null;
        const [x, y] = PROJ.toMap(r.x, r.z);
        const selected = res.id === selectedId;
        return (
          <button
            key={res.id}
            type="button"
            className={clsx('plPin', selected && 'isSelected')}
            style={{ left: x, top: y }}
            aria-label={`${res.name} 위치`}
            onClick={() => onPick(res.id)}
          >
            <Portrait resident={res} className="plPinFace" />
          </button>
        );
      })}
    </div>
  );
}

function PeopleList() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(RESIDENTS[0].id);
  const [, refresh] = useState(0);
  const selected = RESIDENTS.find(r => r.id === selectedId);
  const home = live.residents.find(r => r.def.id === selectedId)?.home;

  // 보는 동안 섬은 멈춘다 (키 입력이 섬 캐릭터를 움직이지 않게). 방향키로 고르기, Esc로 닫기
  useEffect(() => {
    live.islandPaused = true;
    const onKey = (e) => {
      if (e.key === 'Escape') { navigate('/'); return; }
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -2, ArrowDown: 2 }[e.key];
      if (!step) return;
      e.preventDefault();
      setSelectedId(id => {
        const i = RESIDENTS.findIndex(r => r.id === id);
        return RESIDENTS[Math.min(RESIDENTS.length - 1, Math.max(0, i + step))].id;
      });
    };
    window.addEventListener('keydown', onKey);
    // 섬이 아직 준비 중이면 주민 위치(live.residents)가 생길 때까지 가끔 다시 그린다
    const id = setInterval(() => refresh(n => n + 1), 1000);
    return () => {
      clearInterval(id);
      live.islandPaused = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [navigate]);

  return (
    <div className="peopleList">
      <button type="button" className="plClose" onClick={() => navigate('/')}>섬으로</button>

      <section className="plPanel" aria-label="주민 목록">
        <h1 className="plTitle">주민</h1>
        <div className="plGrid">
          {RESIDENTS.map(r => (
            <HouseButton key={r.id} resident={r} selected={r.id === selectedId} onPick={() => setSelectedId(r.id)} />
          ))}
        </div>
        <p className="plCount">{RESIDENTS.length}명이 살고 있어요</p>
      </section>

      <section className="plDetail" aria-live="polite">
        <div className="plProfile" key={selected.id}>
          <Portrait resident={selected} view="body" className="plProfileImg" />
          <div className="plProfileText">
            <span className="plType">{selected.type}</span>
            <h2 className="plName">{selected.name}</h2>
            <p className="plGreeting">“{selected.greeting}”</p>
            <p className="plHome">{home ? `${home.name} 근처를 산책 중` : '섬에 오는 중…'}</p>
          </div>
        </div>
        <ResidentMap selectedId={selectedId} onPick={setSelectedId} />
      </section>
    </div>
  );
}

export default PeopleList;
