import "./Avatar.css";

interface AvatarProps {
  name: string;
  size?: number;
}

/** Initials-based avatar — no image dependency for mock/demo data. */
export function Avatar({ name, size = 36 }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      role="img"
      aria-label={name}
    >
      {initials}
    </span>
  );
}
