import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import TestimonialWidget from "@/components/TestimonialWidget";

export default function WidgetEmbed() {
  const { id } = useParams();
  const [widget, setWidget] = useState(null);
  const [error, setError] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/public/widget/${id}`);
        setWidget(data);
      } catch (e) { setError(true); }
    })();
  }, [id]);

  useEffect(() => {
    const post = () => {
      const h = ref.current ? ref.current.scrollHeight : document.body.scrollHeight;
      window.parent.postMessage({ type: "testify-resize", widgetId: id, height: h + 8 }, "*");
    };
    post();
    const t = setTimeout(post, 300);
    const t2 = setTimeout(post, 1000);
    const ro = new ResizeObserver(post);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("load", post);
    return () => { clearTimeout(t); clearTimeout(t2); ro.disconnect(); window.removeEventListener("load", post); };
  }, [widget, id]);

  const isDark = widget?.configuration?.theme === "dark";
  const bg = widget ? (isDark ? "transparent" : "transparent") : "transparent";

  if (error) return <div style={{ padding: 16, fontFamily: "sans-serif", color: "#888" }}>Widget not found.</div>;
  if (!widget) return <div ref={ref} style={{ padding: 24 }} />;

  return (
    <div ref={ref} style={{ background: bg, padding: 4 }} className="font-body">
      <TestimonialWidget widget={widget} testimonials={widget.testimonials} />
      {widget.branding && (
        <div style={{ textAlign: "center", padding: "10px 0 2px", fontSize: 11, opacity: 0.5, color: isDark ? "#fff" : "#000" }}>
          Powered by <a href={window.location.origin} target="_blank" rel="noreferrer" style={{ color: "inherit", fontWeight: 600 }}>Testify</a>
        </div>
      )}
    </div>
  );
}
