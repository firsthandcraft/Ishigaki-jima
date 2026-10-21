import { useWorldStore } from '../world/store';

// 가까이 간 주민의 인사말 말풍선 (주민이 바뀔 때마다 다시 톡 튀어나온다)
function ResidentBubble() {
  const resident = useWorldStore(s => s.nearResident);
  if (!resident) return null;
  return (
    <div className="residentBubble" key={resident.id} role="status">
      <span className="residentBubbleName">{resident.name}</span>
      <p className="residentBubbleText">{resident.greeting}</p>
    </div>
  );
}

export default ResidentBubble;
