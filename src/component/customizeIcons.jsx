// 꾸미기 화면 탭 아이콘 (24×24, currentColor)
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const FaceIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 13.5q4 3.5 8 0" />
    <circle cx="9" cy="10" r="0.6" fill="currentColor" />
    <circle cx="15" cy="10" r="0.6" fill="currentColor" />
  </svg>
);

export const ScissorsIcon = () => (
  <svg {...base}>
    <circle cx="6.5" cy="17.5" r="3" />
    <circle cx="17.5" cy="17.5" r="3" />
    <path d="M8.5 15.3 18 3.5M15.5 15.3 6 3.5" />
  </svg>
);

export const ShirtIcon = () => (
  <svg {...base}>
    <path d="M8.5 3.5 3.5 6.5l2 4 2.5-1.2V20.5h8V9.3l2.5 1.2 2-4-5-3q-3.5 2.5-7 0Z" />
  </svg>
);

export const ShoeIcon = () => (
  <svg {...base}>
    <path d="M3 17.5V10l5-.5 3 3.5h4q6 1 6 4.5v1H3Z" />
    <path d="M3 15.5h18" />
  </svg>
);

export const HairColorIcon = () => (
  <svg {...base}>
    <path d="M12 3.5s-6 6.5-6 10.5a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5Z" />
    <path d="M9.5 15.5q2.5 1.8 5 0" />
  </svg>
);

export const ShoeColorIcon = () => (
  <svg {...base}>
    <path d="M2.5 19.5v-5l3.5-.4 2 2.3h3q4.5.7 4.5 3.1Z" />
    <path d="M17.5 3.5s-3.5 4-3.5 6.3a3.5 3.5 0 0 0 7 0c0-2.3-3.5-6.3-3.5-6.3Z" />
  </svg>
);

export const SkinIcon = () => (
  <svg {...base}>
    <path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11V4.5a1.5 1.5 0 0 1 3 0V11V5.5a1.5 1.5 0 0 1 3 0V12V8.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.5 14a1.6 1.6 0 0 1 2.6-1.8Z" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...base} strokeWidth={3.2}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
