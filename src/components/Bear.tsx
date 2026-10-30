// シングマちゃん単体の顔。記事の掛け合い(シングマちゃん⇔熊太郎)で、
// 熊太郎の吹き出しと並べてもシングマちゃんだけが写るように使う
export function BearMama({ size = 48 }: { size?: number }) {
  const height = size * (40 / 44);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 44 40"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="9" cy="7" r="4.6" fill="#D85A30" />
      <circle cx="23" cy="7" r="4.6" fill="#D85A30" />
      <circle cx="16" cy="17" r="13" fill="#F0997B" />
      <circle cx="11.3" cy="15" r="1.9" fill="#4A1B0C" />
      <circle cx="20.7" cy="15" r="1.9" fill="#4A1B0C" />
      <ellipse cx="16" cy="21" rx="3.6" ry="2.4" fill="#FAECE7" />
    </svg>
  );
}

// 相談者(名前の無い読者)の顔。熊太郎・シングマちゃんは「くま」なので、
// 色じゃなく種類そのものを変えて(ねこ)、色弱でも一目で区別できるようにする
export function BearConsultant({ size = 44 }: { size?: number }) {
  const height = size * (40 / 44);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 44 40"
      aria-hidden="true"
      className="shrink-0"
    >
      <polygon points="3,12 10,-2 16,10" fill="#9B8F82" />
      <polygon points="29,12 22,-2 16,10" fill="#9B8F82" />
      <circle cx="16" cy="17" r="13" fill="#D9CFC1" />
      <circle cx="11.3" cy="15" r="1.9" fill="#4A1B0C" />
      <circle cx="20.7" cy="15" r="1.9" fill="#4A1B0C" />
      <polygon points="16,19.5 14.2,22 17.8,22" fill="#4A1B0C" />
    </svg>
  );
}

// 記事一覧のアイキャッチ用。シングマちゃんを中央に大きく置いて、右下にカテゴリごとのバッジを添える
function CategoryBearBase() {
  return (
    <>
      <circle cx="13.7" cy="10.4" r="5.5" fill="#D85A30" />
      <circle cx="30.4" cy="10.4" r="5.5" fill="#D85A30" />
      <circle cx="22.1" cy="22.3" r="15.5" fill="#F0997B" />
      <circle cx="16.5" cy="19.9" r="2.3" fill="#4A1B0C" />
      <circle cx="27.7" cy="19.9" r="2.3" fill="#4A1B0C" />
      <ellipse cx="22.1" cy="27" rx="4.3" ry="2.9" fill="#FAECE7" />
    </>
  );
}

export function BearMoney({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <CategoryBearBase />
      <circle cx="36.5" cy="36.5" r="11" fill="white" />
      <circle cx="36.5" cy="36.5" r="8" fill="#F6D98E" />
      <text x="36.5" y="40.7" textAnchor="middle" fontSize="11" fontWeight="700" fill="#A8713B">
        ¥
      </text>
    </svg>
  );
}

export function BearHospital({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <CategoryBearBase />
      <circle cx="36.5" cy="36.5" r="11" fill="white" />
      <rect x="28.5" y="33.25" width="16" height="6.5" fill="#E0918C" />
      <rect x="33.25" y="28.5" width="6.5" height="16" fill="#E0918C" />
    </svg>
  );
}

export function BearHeart({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <CategoryBearBase />
      <circle cx="36.5" cy="36.5" r="11" fill="white" />
      <path
        d="M36.5 41.5c-3.6-2.5-5.3-4.7-5.3-6.9a2.9 2.9 0 0 1 5.3-1.6 2.9 2.9 0 0 1 5.3 1.6c0 2.2-1.7 4.4-5.3 6.9Z"
        fill="#E8A183"
      />
    </svg>
  );
}

export function BearWork({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <CategoryBearBase />
      <circle cx="36.5" cy="36.5" r="11" fill="white" />
      <rect x="33.75" y="31.4" width="5.5" height="3.4" rx="1.7" fill="#7A9CC0" />
      <rect x="35" y="32.6" width="3" height="1.6" rx="0.8" fill="white" />
      <rect x="30.5" y="34" width="12" height="8" rx="1.4" fill="#7A9CC0" />
      <rect x="35.2" y="33.2" width="2.6" height="2" rx="0.4" fill="white" />
    </svg>
  );
}

export function BearDefault({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <CategoryBearBase />
      <circle cx="32.6" cy="29.2" r="3.4" fill="#D85A30" />
      <circle cx="40.4" cy="29.2" r="3.4" fill="#D85A30" />
      <circle cx="36.5" cy="37" r="9.1" fill="#F5C4B3" />
      <circle cx="33.9" cy="35.7" r="1.3" fill="#4A1B0C" />
      <circle cx="39.1" cy="35.7" r="1.3" fill="#4A1B0C" />
      <ellipse cx="36.5" cy="39.6" rx="2.3" ry="1.56" fill="#FAECE7" />
    </svg>
  );
}

export function BearCub({ size = 20 }: { size?: number }) {
  const height = size * (17 / 20);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 20 17"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="7" cy="3" r="2.6" fill="#F0997B" />
      <circle cx="13" cy="3" r="2.6" fill="#F0997B" />
      <circle cx="10" cy="9" r="7" fill="#F5C4B3" />
      <circle cx="8" cy="8" r="1" fill="#4A1B0C" />
      <circle cx="12" cy="8" r="1" fill="#4A1B0C" />
      <ellipse cx="10" cy="11" rx="1.8" ry="1.2" fill="#FAECE7" />
    </svg>
  );
}

export function BearParentChild({ size = 44 }: { size?: number }) {
  const scale = size / 44;
  const height = 40 * scale;
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 44 40"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="9" cy="7" r="4" fill="#D85A30" />
      <circle cx="23" cy="7" r="4" fill="#D85A30" />
      <circle cx="16" cy="16" r="11" fill="#F0997B" />
      <circle cx="12.5" cy="14.5" r="1.5" fill="#4A1B0C" />
      <circle cx="19.5" cy="14.5" r="1.5" fill="#4A1B0C" />
      <ellipse cx="16" cy="19.5" rx="3" ry="2" fill="#FAECE7" />
      <circle cx="33" cy="27" r="2.6" fill="#F0997B" />
      <circle cx="39" cy="27" r="2.6" fill="#F0997B" />
      <circle cx="36" cy="33" r="7" fill="#F5C4B3" />
      <circle cx="34" cy="32" r="1" fill="#4A1B0C" />
      <circle cx="38" cy="32" r="1" fill="#4A1B0C" />
      <ellipse cx="36" cy="35" rx="1.8" ry="1.2" fill="#FAECE7" />
    </svg>
  );
}
