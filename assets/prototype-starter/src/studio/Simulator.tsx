import { useState, type ReactNode } from "react";
import {
  ArrowClockwise,
  ArrowLeft,
  CaretLeft,
  CaretRight,
  CellSignalFull,
  Globe,
  LockSimple,
  Minus,
  Plus,
  WifiHigh,
  X,
} from "@phosphor-icons/react";
import { hostLabels, type Host } from "./model.ts";

export function Simulator({
  host,
  label,
  title,
  children,
  miniature = false,
}: {
  host: Host;
  label: string;
  title: string;
  children: ReactNode;
  miniature?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [maximized, setMaximized] = useState(false);
  const mobile = host === "ios" || host === "android";
  return (
    <section
      className={`simulator ${mobile ? "mobile" : "desktop"} ${miniature ? "miniature" : ""} ${maximized ? "maximized" : ""}`}
      aria-label={`${label} ${hostLabels[host]} 模拟器`}
    >
      {!miniature && (
        <header className="simulator-label">
          <span>
            <i />
            {hostLabels[host]}
            <small>{label}</small>
          </span>
          <div>
            {open && (
              <button
                title="切换演示尺寸"
                aria-label={`${label}切换演示尺寸`}
                onClick={() => setMaximized(!maximized)}
              >
                <Plus size={14} />
              </button>
            )}
            <button
              onClick={() => {
                setOpen(!open);
                setMaximized(false);
              }}
            >
              {open ? "关闭模拟器" : "打开模拟器"}
            </button>
          </div>
        </header>
      )}
      {open ? (
        <div className={`host-frame host-${host}`}>
          {host === "macos" && (
            <div className="mac-chrome">
              <div className="traffic">
                <button
                  aria-label={`${label}关闭窗口`}
                  onClick={() => {
                    setOpen(false);
                    setMaximized(false);
                  }}
                >
                  <X size={8} />
                </button>
                <button
                  aria-label={`${label}最小化窗口`}
                  onClick={() => {
                    setOpen(false);
                    setMaximized(false);
                  }}
                >
                  <Minus size={8} />
                </button>
                <button
                  aria-label={`${label}放大窗口`}
                  onClick={() => setMaximized(!maximized)}
                >
                  <Plus size={8} />
                </button>
              </div>
              <span>{title}</span>
              <small>设计原型</small>
            </div>
          )}
          {host === "web" && (
            <div className="web-chrome">
              <div className="web-tab">
                <Globe size={13} />
                {title}
                <X size={12} />
              </div>
              <div className="address-row">
                <CaretLeft size={14} />
                <CaretRight size={14} />
                <ArrowClockwise size={13} />
                <span>
                  <LockSimple size={11} />
                  prototype.local / feedback
                </span>
              </div>
            </div>
          )}
          {mobile && (
            <div className="phone-status">
              <span>9:41</span>
              {host === "ios" ? (
                <i className="island" />
              ) : (
                <i className="camera" />
              )}
              <div>
                <CellSignalFull size={14} weight="fill" />
                <WifiHigh size={14} />
                <i className="battery" />
              </div>
            </div>
          )}
          <div className="host-content">{children}</div>
          {mobile && (
            <div className="phone-home">
              <i />
            </div>
          )}
        </div>
      ) : (
        <div className="closed-host">
          <Globe size={28} />
          <strong>{hostLabels[host]} 模拟器已关闭</strong>
          <p>共享演示数据仍然保留。</p>
          <button onClick={() => setOpen(true)}>
            重新打开 <ArrowLeft size={14} />
          </button>
        </div>
      )}
    </section>
  );
}
