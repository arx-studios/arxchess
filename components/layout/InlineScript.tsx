// Runs during HTML parsing on full page loads. On the client React renders it as
// inert text/plain so it neither re-runs nor warns (see Next's
// "Preventing flash before hydration" guide).
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
