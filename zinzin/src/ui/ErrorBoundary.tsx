import { Component, type ErrorInfo, type ReactNode } from "react";
import { ZBlob } from "./ZBlob";
import { BigBtn } from "./common";
import { getLang, pick } from "@/lib/i18n";
import { UI } from "../strings";

/**
 * Filet de sécurité : si un jeu (ou l'app) plante, on affiche un écran « Oups »
 * avec une sortie, au lieu d'un écran noir.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; onBack: () => void; /** absent = « Relancer Zinzin » traduit */ backLabel?: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[zinzin] crash", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const t = pick(UI, getLang());
    return (
      <div className="zz-page fixed inset-0 flex flex-col items-center justify-center px-8 text-center" style={{ zIndex: 90 }}>
        <ZBlob size={120} color="coral" mood="dead" seed={5} outline />
        <h1 className="zz-title mt-6 text-white" style={{ fontSize: 34 }}>{t.oopsTitle}</h1>
        <p className="mt-3 text-[16px] leading-relaxed" style={{ color: "var(--zz-dim)" }}>
          {t.oopsText}
        </p>
        <BigBtn
          onClick={() => { this.setState({ failed: false }); this.props.onBack(); }}
          bg="#FFD23F"
          className="mt-8 w-full max-w-xs"
        >
          {this.props.backLabel ?? t.relaunch}
        </BigBtn>
      </div>
    );
  }
}
