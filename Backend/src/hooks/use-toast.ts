// client/src/hooks/use-toast.ts
export const toast = (opts: { title?: string; description?: string; variant?: string } = {}) => {
  try {
    // For now, simple alerts (replace with your UI toast later)
    if (opts.variant === "destructive") {
      alert(`${opts.title ?? "Error"}\n${opts.description ?? ""}`);
    } else {
      // console.info for non-blocking dev feedback and small browser notification
      console.info("toast:", opts.title, opts.description);
    }
  } catch {}
};

export default toast;
