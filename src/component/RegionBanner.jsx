import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorldStore } from '../world/store';
import { placeById } from '../world/poi';

const SHOW_MS = 3200;
let introShown = false; // 섬 진입 배너는 페이지를 연 뒤 처음 한 번만

// 동물의 숲 지역 이름 배너: 섬에 처음 들어올 때 + 장소 반경에 들어갈 때 잠깐 표시.
// 환영 배너가 떠 있는 동안 들어온 장소 배너는 끝난 뒤 이어서 띄운다.
function RegionBanner() {
  const ready = useWorldStore(s => s.ready);
  const nearPlaceId = useWorldStore(s => s.nearPlaceId);
  const [banner, setBanner] = useState(null);
  const timer = useRef(null);
  const introUntil = useRef(0);
  const queued = useRef(null);

  // ref와 setState만 쓰므로 한 번 만든 함수를 계속 쓴다
  const show = useCallback((title, sub) => {
    clearTimeout(timer.current);
    setBanner({ title, sub, key: Date.now() });
    timer.current = setTimeout(() => {
      setBanner(null);
      const next = queued.current;
      queued.current = null;
      if (next) show(next.title, next.sub);
    }, SHOW_MS);
  }, []);

  useEffect(() => {
    if (ready && !introShown) {
      introShown = true;
      introUntil.current = Date.now() + SHOW_MS;
      show('Ishigaki Island', '石垣島');
    }
  }, [ready, show]);

  useEffect(() => {
    const place = placeById(nearPlaceId);
    if (!place) return;
    const next = { title: place.name, sub: place.ja };
    if (Date.now() < introUntil.current) queued.current = next;
    else show(next.title, next.sub);
  }, [nearPlaceId, show]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!banner) return null;
  return (
    <div className="regionBanner" key={banner.key} role="status">
      <span className="regionBannerTitle">{banner.title}</span>
      <span className="regionBannerSub">{banner.sub}</span>
    </div>
  );
}

export default RegionBanner;
