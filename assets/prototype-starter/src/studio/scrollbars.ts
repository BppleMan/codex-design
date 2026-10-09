import { useLayoutEffect } from "react";
import {
  OverlayScrollbars,
  type OverlayScrollbars as ScrollInstance,
} from "overlayscrollbars";
export function useOverlayScrollbars() {
  useLayoutEffect(() => {
    const instances = new Map<HTMLElement, ScrollInstance>();
    const attach = (element: HTMLElement) => {
      if (!instances.has(element))
        instances.set(
          element,
          OverlayScrollbars(
            { target: element, elements: { viewport: element } },
            {
              scrollbars: {
                theme: "os-theme-studio",
                autoHide: "leave",
                autoHideDelay: 650,
                dragScroll: true,
                clickScroll: "instant",
              },
            },
          ),
        );
    };
    const reconcile = () => {
      for (const [element, instance] of instances) {
        if (!element.isConnected) {
          instance.destroy();
          instances.delete(element);
        }
      }
      attach(document.body);
      document
        .querySelectorAll<HTMLElement>("[data-scroll-area]")
        .forEach(attach);
    };
    reconcile();
    const observer = new MutationObserver(reconcile);
    observer.observe(document.getElementById("root")!, {
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      instances.forEach((instance) => instance.destroy());
    };
  }, []);
}
