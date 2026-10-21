import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import '../css/characterCustomize.css';
import CharacterPreview from './CharacterPreview';
import { FaceThumb, ModelThumb, ColorBlob } from './customizeThumbs';
import {
  FaceIcon, ScissorsIcon, ShirtIcon, ShoeIcon, HairColorIcon, ShoeColorIcon, SkinIcon, CheckIcon,
} from './customizeIcons';
import {
  EYES, NOSES, MOUTHS, HAIRS, OUTFITS, SHOES, HAIR_COLORS, SHOE_COLORS, SKIN_COLORS, apply, currentOutfitId,
} from '../character/customize';
import { live, saveCharacter, useWorldStore } from '../world/store';

const TABS = [
  { id: 'face', label: '얼굴', Icon: FaceIcon },
  { id: 'hair', label: '머리스타일', Icon: ScissorsIcon },
  { id: 'outfit', label: '옷', Icon: ShirtIcon },
  { id: 'shoes', label: '신발', Icon: ShoeIcon },
  { id: 'hairColor', label: '머리 컬러', Icon: HairColorIcon },
  { id: 'shoeColor', label: '신발 컬러', Icon: ShoeColorIcon },
  { id: 'skinColor', label: '피부 컬러', Icon: SkinIcon },
];

const FACE_PARTS = [
  { id: 'eyes', label: '눈', options: EYES },
  { id: 'nose', label: '코', options: NOSES },
  { id: 'mouth', label: '입', options: MOUTHS },
];

const SKIN_LABELS = ['아주 밝은', '밝은', '연한', '중간 밝은', '중간', '구릿빛', '진한', '아주 진한'];

function OptionCard({ selected, label, onPick, children }) {
  return (
    <button
      type="button"
      className={clsx('ccOption', selected && 'isSelected')}
      aria-pressed={selected}
      onClick={onPick}
    >
      {children}
      <span className="ccOptionLabel">{label}</span>
      {selected && <span className="ccCheck"><CheckIcon /></span>}
    </button>
  );
}

function Swatch({ color, label, selected, onPick }) {
  return (
    <button
      type="button"
      className={clsx('ccSwatch', selected && 'isSelected')}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      onClick={onPick}
    >
      <ColorBlob color={color} selected={selected} />
      {selected && <span className="ccCheck"><CheckIcon /></span>}
    </button>
  );
}

const sameColor = (a, b) => a?.toLowerCase() === b?.toLowerCase();

// 캐릭터 꾸미기 (/character). 고치는 동안은 draft만 바뀌고, "결정"을 눌러야 섬 캐릭터에 저장된다.
function CharacterCustomize() {
  const navigate = useNavigate();
  const saved = useWorldStore(s => s.character);
  const [draft, setDraft] = useState(saved);
  const [tab, setTab] = useState(0);
  const [facePart, setFacePart] = useState('eyes');
  const [bounceKey, setBounceKey] = useState(0);

  const pick = (kind, value) => {
    setDraft(cfg => apply[kind](cfg, value));
    setBounceKey(k => k + 1);
  };
  const moveTab = (step) => setTab(t => (t + step + TABS.length) % TABS.length);
  const decide = () => {
    saveCharacter(draft);
    navigate('/');
  };
  const cancel = () => navigate('/');

  // 꾸미는 동안 섬은 멈추고 (WASD·Q/E가 섬 캐릭터·카메라를 움직이지 않게), Q/E로 탭 이동, Esc로 취소
  useEffect(() => {
    live.islandPaused = true;
    const onKey = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'KeyQ') moveTab(-1);
      else if (e.code === 'KeyE') moveTab(1);
      else if (e.code === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', onKey);
    return () => {
      live.islandPaused = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [navigate]);

  const current = TABS[tab];

  let grid;
  if (current.id === 'face') {
    const part = FACE_PARTS.find(f => f.id === facePart);
    grid = part.options.map(o => (
      <OptionCard key={o.id} label={o.label} selected={draft[part.id].style === o.id} onPick={() => pick(part.id, o.id)}>
        <FaceThumb part={part.id} id={o.id} eyeColor={draft.eyes.color} skinColor={draft.skinColor} />
      </OptionCard>
    ));
  } else if (current.id === 'hair' || current.id === 'outfit' || current.id === 'shoes') {
    const { options, view, selectedId } = {
      hair: { options: HAIRS, view: 'head', selectedId: draft.hair.style },
      outfit: { options: OUTFITS, view: 'body', selectedId: currentOutfitId(draft) },
      shoes: { options: SHOES, view: 'feet', selectedId: draft.shoes.style },
    }[current.id];
    grid = options.map(o => (
      <OptionCard key={o.id} label={o.label} selected={selectedId === o.id} onPick={() => pick(current.id, o.id)}>
        <ModelThumb cfg={apply[current.id](draft, o.id)} view={view} />
      </OptionCard>
    ));
  } else if (current.id === 'skinColor') {
    grid = SKIN_COLORS.map((c, i) => (
      <Swatch key={c} color={c} label={SKIN_LABELS[i]} selected={sameColor(draft.skinColor, c)} onPick={() => pick('skinColor', c)} />
    ));
  } else {
    const [palette, value] = current.id === 'hairColor'
      ? [HAIR_COLORS, draft.hair.color]
      : [SHOE_COLORS, draft.shoes.color];
    grid = palette.map(({ color, label }) => (
      <Swatch key={color} color={color} label={label} selected={sameColor(value, color)} onPick={() => pick(current.id, color)} />
    ));
  }

  return (
    <div className="characterCustomize">
      <section className="ccStage">
        <CharacterPreview config={draft} bounceKey={bounceKey} />
        <p className="ccDragHint">드래그해서 돌려 보세요</p>
      </section>

      <section className="ccPanel">
        <div className="ccTabBar">
          <button type="button" className="ccKey" onClick={() => moveTab(-1)} aria-label="이전 탭 (Q)">Q</button>
          <div className="ccTabs" role="tablist" aria-label="꾸밀 항목">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={i === tab}
                aria-label={t.label}
                className={clsx('ccTab', i === tab && 'isSelected')}
                onClick={() => setTab(i)}
              >
                {i === tab && <span className="ccTabLabel">{t.label}</span>}
                <t.Icon />
              </button>
            ))}
          </div>
          <button type="button" className="ccKey" onClick={() => moveTab(1)} aria-label="다음 탭 (E)">E</button>
        </div>

        {current.id === 'face' && (
          <div className="ccSubTabs" role="tablist" aria-label="얼굴 부위">
            {FACE_PARTS.map(f => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={facePart === f.id}
                className={clsx('ccSubTab', facePart === f.id && 'isSelected')}
                onClick={() => setFacePart(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className={clsx('ccGrid', current.id.endsWith('Color') && 'isSwatches')} role="tabpanel">
          {grid}
        </div>

        <button type="button" className="ccDecide" onClick={decide}>결정</button>
      </section>

      <button type="button" className="ccCancel" onClick={cancel}>취소</button>
    </div>
  );
}

export default CharacterCustomize;
