import { flushSync } from "react-dom";

type Transition = { finished: Promise<void>; ready?: Promise<void>; updateCallbackDone?: Promise<void> };
type VTDocument = Document & { startViewTransition?: (cb: () => void) => Transition };

function observeTransition(t: Transition) {
  // Rapid navigation may skip an animation while the DOM update still succeeds.
  void t.ready?.catch(() => {});
  void t.finished.catch(() => {});
  void t.updateCallbackDone?.catch((error) => console.error(error));
}

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Run a DOM-changing update inside a View Transition when the browser supports it. */
export function transition(update: () => void) {
  const d = document as VTDocument;
  if (!d.startViewTransition || reduced()) {
    update();
    return;
  }
  observeTransition(d.startViewTransition(() => flushSync(update)));
}

/** Morph an element (e.g. a gallery tile's illustration) into the word card. */
export function morphFrom(el: HTMLElement | null | undefined, update: () => void) {
  const d = document as VTDocument;
  if (!el || !d.startViewTransition || reduced()) {
    update();
    return;
  }
  el.style.viewTransitionName = "word-art";
  const t = d.startViewTransition(() => {
    el.style.viewTransitionName = "";
    flushSync(update);
  });
  observeTransition(t);
  void t.finished.then(
    () => (el.style.viewTransitionName = ""),
    () => (el.style.viewTransitionName = ""),
  );
}
