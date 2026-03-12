import { useEffect, useRef } from "react";
import { T } from "../styles/theme.js";

export function LogFeed({ log }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log]);

  return (
    <div
      ref={ref}
      style={{
        height: 160,
        overflowY: "auto",
        fontFamily: T.mono,
        fontSize: 11,
        lineHeight: 1.6,
        color: T.bAqua,
        padding: "8px 10px",
        background: "rgba(0,0,0,0.5)",
        borderRadius: T.radiusSm,
        border: `1px solid ${T.bg2}`,
      }}
    >
      {log.slice(-50).map((l, i) => (
        <div key={i} style={{ opacity: 0.4 + (i / 50) * 0.6 }}>
          <span style={{ color: T.bg4, marginRight: 6 }}>
            {new Date(l.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          {l.msg}
        </div>
      ))}
    </div>
  );
}
