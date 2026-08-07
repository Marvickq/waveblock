"use client";
import { useEffect } from "react";

/**
 * ScrollReveal — global IntersectionObserver that wires .wb-reveal*, .wb-card-hover
 * to their active states as elements enter the viewport.
 * Lives in the root layout so every page benefits automatically.
 */
export default function ScrollReveal() {
  useEffect(() => {
    // Respect reduced-motion preference
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // Immediately mark everything as revealed
      document
        .querySelectorAll<HTMLElement>(".wb-reveal, .wb-reveal-lg, .wb-reveal-fade, .wb-reveal-scale")
        .forEach((el) => el.classList.add("wb-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("wb-revealed");
            observer.unobserve(entry.target); // fire once
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -48px 0px", // trigger slightly before element is fully visible
      }
    );

    const observe = () => {
      document
        .querySelectorAll<HTMLElement>(".wb-reveal, .wb-reveal-lg, .wb-reveal-fade, .wb-reveal-scale")
        .forEach((el) => {
          if (!el.classList.contains("wb-revealed")) {
            observer.observe(el);
          }
        });
    };

    observe();

    // Re-observe after any DOM mutations (e.g. route changes)
    const mutationObserver = new MutationObserver(observe);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
