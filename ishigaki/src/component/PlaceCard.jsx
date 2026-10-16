import { useEffect, useState } from 'react';
import { useWorldStore } from '../world/store';
import { placeById } from '../world/poi';
import { POI } from '../world/config';

// 장소 가까이 가면 아래에서 올라오는 여행 기록 카드. 내용은 src/data/places.json 에서 읽는다.
function PlaceCard() {
  const nearPlaceId = useWorldStore(s => s.nearPlaceId);
  const near = placeById(nearPlaceId);
  // 멀어질 때도 내려가는 애니메이션 동안 마지막 장소 내용을 보여 준다
  const [shown, setShown] = useState(near);
  useEffect(() => {
    if (near) setShown(near);
  }, [near]);

  if (!shown) return null;
  const hasRecord = shown.date || shown.memo || shown.photos.length > 0;
  return (
    <section className={`placeCard ${near ? 'open' : ''}`} aria-hidden={!near}>
      <header className="placeCardHeader">
        <span className="placeCardIcon" aria-hidden="true">{POI.ICONS[shown.icon] ?? '🗼'}</span>
        <div>
          <h2 className="placeCardName">{shown.name}</h2>
          <p className="placeCardJa">{shown.ja}</p>
        </div>
        {shown.date && <time className="placeCardDate">{shown.date}</time>}
      </header>
      {shown.photos.length > 0 && (
        <div className="placeCardPhotos">
          {shown.photos.map(file => (
            <img key={file} src={`/photos/${file}`} alt={`${shown.name} 사진`} loading="lazy" />
          ))}
        </div>
      )}
      {hasRecord
        ? shown.memo && <p className="placeCardMemo">{shown.memo}</p>
        : <p className="placeCardEmpty">아직 여행 기록이 없어요.</p>}
    </section>
  );
}

export default PlaceCard;
