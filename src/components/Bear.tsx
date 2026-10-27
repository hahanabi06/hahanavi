export function BearFace({ size = 48 }: { size?: number }) {
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
