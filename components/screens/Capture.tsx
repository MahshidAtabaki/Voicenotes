import { useVC } from "@/lib/store";
import type { CaptureKind } from "@/lib/types";
import { css } from "../css";
import { demoBackgroundContext } from "@/lib/background-context";

const REVEAL = 190;

export function Capture() {
  const vc = useVC();
  const status = vc.status;
  const isVoice = vc.inputMode !== "text";
  const isText = vc.inputMode === "text";

  const capRequesting = status === "requesting_microphone";
  const micError = status === "failed" && vc.micError != null;
  const procFailed = status === "failed" && vc.micError == null;
  const capLive = status === "recording" || status === "paused";
  const capProcessing =
    status === "uploading" || status === "transcribing" || status === "organising";

  return (
    <div
      className="vc-screen"
      style={css(
        "position:absolute;inset:0;background:#0b0b0f;color:#fff;overflow:hidden;display:flex;flex-direction:column",
      )}
    >
      {capRequesting && <RequestingPermission />}
      {micError && <MicErrorView />}
      {procFailed && <ProcessingError />}
      {capLive && <LiveCapture isVoice={isVoice} isText={isText} />}
      {capProcessing && <Processing kind={vc.captureKind} />}
    </div>
  );
}

/* ---------- requesting microphone permission ---------- */
function RequestingPermission() {
  const vc = useVC();
  return (
    <div
      style={css(
        "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 36px;text-align:center;background:radial-gradient(circle at 50% 28%,#12395f,#081b31 82%)",
      )}
    >
      <button
        className="vc-press"
        onClick={vc.cancelCapture}
        style={css(
          "position:absolute;top:62px;left:22px;width:40px;height:40px;border:none;border-radius:50%;background:rgba(255,255,255,.18);color:#fff;font-size:20px;cursor:pointer;z-index:2",
        )}
      >
        ✕
      </button>
      <div className="vc-idle-in" style={css("display:flex;flex-direction:column;align-items:center")}>
        <div style={css("display:flex;align-items:flex-end;gap:4px;height:26px;margin-bottom:22px")}>
          <span style={css("width:4px;height:60%;background:#fff;border-radius:2px;animation:vcSpeak .7s ease-in-out infinite")} />
          <span style={css("width:4px;height:100%;background:#fff;border-radius:2px;animation:vcSpeak .7s ease-in-out infinite .12s")} />
          <span style={css("width:4px;height:45%;background:#fff;border-radius:2px;animation:vcSpeak .7s ease-in-out infinite .24s")} />
          <span style={css("width:4px;height:80%;background:#fff;border-radius:2px;animation:vcSpeak .7s ease-in-out infinite .36s")} />
        </div>
        <span style={css("font-size:24px;font-weight:600;letter-spacing:-.4px;color:#fff;margin-bottom:12px")}>
          What would you like to record?
        </span>
        <p style={css("font-size:15px;line-height:1.5;color:rgba(255,255,255,.82);margin:0 0 32px;max-width:280px")}>
          Allow microphone access to begin. Your recording stays private to you.
        </p>
        <button
          className="vc-press"
          onClick={vc.allowMic}
          style={css(
            "width:100%;max-width:300px;height:54px;border:none;border-radius:16px;background:#fff;color:#0b2a52;font-size:18px;font-weight:600;letter-spacing:-.2px;cursor:pointer;box-shadow:0 14px 34px -12px rgba(0,0,0,.45)",
          )}
        >
          Allow microphone
        </button>
        <button
          onClick={vc.startDemo}
          style={css(
            "margin-top:16px;background:none;border:none;color:rgba(255,255,255,.85);font-size:14px;cursor:pointer",
          )}
        >
          No mic here? Use a sample recording
        </button>
      </div>
    </div>
  );
}

/* ---------- mic error ---------- */
function MicErrorView() {
  const vc = useVC();
  return (
    <>
      <button
        className="vc-press"
        onClick={vc.cancelCapture}
        style={css(
          "position:absolute;top:58px;left:20px;display:flex;align-items:center;gap:2px;border:none;background:rgba(255,255,255,.1);color:#fff;border-radius:20px;padding:8px 13px 8px 9px;font-size:15px;font-weight:500;cursor:pointer;z-index:6",
        )}
      >
        <BackArrow />
        Back
      </button>
      <div
        style={css(
          "flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 36px;text-align:center",
        )}
      >
        <h2 style={css("font-size:22px;font-weight:600;letter-spacing:-.3px;margin:0 0 10px")}>
          {vc.micError?.title}
        </h2>
        <p style={css("font-size:15px;line-height:1.5;color:#9a9aa2;margin:0 0 32px;max-width:290px")}>
          {vc.micError?.body}
        </p>
        <button
          className="vc-press"
          onClick={vc.allowMic}
          style={css(
            "width:100%;max-width:300px;height:52px;border:none;border-radius:15px;background:#0066cc;color:#fff;font-size:17px;font-weight:600;cursor:pointer",
          )}
        >
          Allow
        </button>
        <button
          className="vc-press"
          onClick={vc.cancelCapture}
          style={css(
            "margin-top:12px;background:none;border:none;color:#9a9aa2;font-size:16px;cursor:pointer",
          )}
        >
          Not now
        </button>
        <button
          onClick={vc.startDemo}
          style={css(
            "margin-top:8px;background:none;border:none;color:#6e6e73;font-size:14px;cursor:pointer",
          )}
        >
          Try with a sample recording
        </button>
      </div>
    </>
  );
}

/* ---------- processing failed (retryable) ---------- */
function ProcessingError() {
  const vc = useVC();
  return (
    <div
      style={css(
        "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 36px;text-align:center;background:radial-gradient(circle at 50% 30%,#12395f,#081b31 84%)",
      )}
    >
      <h2 style={css("font-size:22px;font-weight:600;letter-spacing:-.3px;margin:0 0 10px")}>
        Something interrupted that.
      </h2>
      <p style={css("font-size:15px;line-height:1.5;color:#9a9aa2;margin:0 0 32px;max-width:290px")}>
        Your words are safe. Let&apos;s try organising them again.
      </p>
      <button
        className="vc-press"
        onClick={vc.retryProcessing}
        style={css(
          "width:100%;max-width:300px;height:52px;border:none;border-radius:15px;background:#0066cc;color:#fff;font-size:17px;font-weight:600;cursor:pointer",
        )}
      >
        Try again
      </button>
      <button
        className="vc-press"
        onClick={vc.cancelCapture}
        style={css("margin-top:12px;background:none;border:none;color:#9a9aa2;font-size:16px;cursor:pointer")}
      >
        Not now
      </button>
    </div>
  );
}

/* ---------- live recording / text composer ---------- */
function LiveCapture({ isVoice, isText }: { isVoice: boolean; isText: boolean }) {
  const vc = useVC();
  const paused = vc.paused;
  const revealProgress = (vc.revealDelta || 0) / REVEAL;
  const revealTrans = vc.dragging
    ? "none"
    : "transform .45s cubic-bezier(.2,.85,.22,1), opacity .3s ease";
  const hasTranscript = vc.liveTranscript.length > 0;
  const canSend = vc.textDraft.trim().length > 0;

  return (
    <div
      className="vc-idle-in"
      style={css(
        "position:absolute;inset:0;overflow:hidden;background:radial-gradient(circle at 50% 30%,#12395f,#081b31 84%);color:#fff",
      )}
    >
      {/* revealed transcript (voice) */}
      {isVoice && (
        <div
          ref={vc.setTransEl}
          onScroll={vc.onTransScroll}
          className="vc-scroll"
          style={{
            ...css(
              "position:absolute;top:132px;left:18px;right:18px;bottom:172px;overflow-y:auto;z-index:2",
            ),
            opacity: revealProgress,
            transition: revealTrans,
          }}
        >
          <div style={css("font-size:12px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:12px")}>
            Transcript appears after recording
          </div>
          {hasTranscript ? (
            <p style={css("font-size:21px;line-height:1.6;color:#fff;margin:0;letter-spacing:-.3px")}>
              {vc.liveTranscript}
              <span
                style={css(
                  "display:inline-block;width:2.5px;height:22px;background:#2997ff;margin-left:4px;vertical-align:-4px;animation:vcPulse 1s ease-in-out infinite",
                )}
              />
            </p>
          ) : (
            <p style={css("font-size:19px;line-height:1.6;color:rgba(255,255,255,.5);margin:0")}>
              We&apos;re recording real audio. Your transcript will appear after you finish.
            </p>
          )}
        </div>
      )}

      {/* top fade */}
      <div
        style={css(
          "position:absolute;top:0;left:0;right:0;height:140px;background:linear-gradient(#081b31 22%,rgba(8,27,49,0));pointer-events:none;z-index:3",
        )}
      />
      <button
        className="vc-press"
        onClick={vc.requestBack}
        aria-label="Back"
        style={css(
          "position:absolute;top:56px;left:18px;display:flex;align-items:center;gap:2px;border:none;border-radius:20px;background:rgba(255,255,255,.14);color:#fff;font-size:15px;font-weight:500;padding:8px 13px 8px 9px;cursor:pointer;z-index:6",
        )}
      >
        <BackArrow />
        Back
      </button>

      {isVoice && (
        <div style={css("position:absolute;top:88px;left:0;right:0;text-align:center;z-index:5;pointer-events:none")}>
          <div style={css("display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:rgba(255,255,255,.9)")}>
            <span
              style={{
                ...css("width:9px;height:9px;border-radius:50%"),
                background: paused ? "rgba(255,255,255,.6)" : "#ff453a",
                animation: paused ? undefined : "vcPulse 1.4s ease-in-out infinite",
              }}
            />
            {paused ? "Paused" : "Listening"}
          </div>
          <div style={css("font-size:34px;font-weight:600;letter-spacing:-.6px;font-variant-numeric:tabular-nums;margin-top:4px")}>
            {vc.fmtTime(vc.elapsed)}
          </div>
        </div>
      )}

      {/* circular waveform + controls (voice) */}
      {isVoice && (
        <div
          style={{
            ...css(
              "position:absolute;top:170px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:20px;z-index:4",
            ),
            transform: `translateY(${vc.revealDelta || 0}px)`,
            transition: revealTrans,
          }}
        >
          <div
            onPointerDown={vc.onWaveDown}
            onPointerMove={vc.onWaveMove}
            onPointerUp={vc.onWaveUp}
            style={css(
              "width:212px;height:212px;border-radius:50%;background:rgba(41,151,255,.16);border:1px solid rgba(130,195,255,.28);display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none;cursor:grab",
            )}
          >
            <canvas ref={vc.setWaveEl} style={css("width:190px;height:120px")} />
          </div>
          <button
            className="vc-press"
            onClick={vc.togglePause}
            style={css(
              "display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.1);color:#fff;border-radius:22px;padding:10px 18px;font-size:15px;font-weight:600;cursor:pointer",
            )}
          >
            {paused ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
                <rect x="6" y="5" width="4" height="14" rx="1.5" />
                <rect x="14" y="5" width="4" height="14" rx="1.5" />
              </svg>
            )}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            className="vc-press"
            onClick={vc.toggleTranscript}
            style={css(
              "display:flex;align-items:center;gap:6px;border:none;background:none;color:rgba(255,255,255,.78);font-size:14px;font-weight:600;cursor:pointer",
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {vc.transcriptVisible ? "Hide transcript" : "Show transcript"}
          </button>
        </div>
      )}

      {/* text header */}
      {isText && (
        <div style={css("position:absolute;top:118px;left:26px;right:26px;z-index:3")}>
          <div style={css("font-size:24px;font-weight:600;letter-spacing:-.4px;color:#fff;margin-bottom:8px")}>
            Write a thought
          </div>
          <div style={css("font-size:15px;line-height:1.5;color:rgba(255,255,255,.68)")}>
            Type freely below, or tap the mic to speak. I&apos;ll organise it — I never
            rewrite your words.
          </div>
        </div>
      )}

      {/* bottom composer */}
      <div
        style={css(
          "position:absolute;left:0;right:0;bottom:0;z-index:7;padding:14px 16px 30px;background:linear-gradient(rgba(8,27,49,0),#081b31 34%)",
        )}
      >
        <BackgroundSummary />
        {isVoice && (
          <div style={css("display:flex;align-items:center;gap:10px")}>
            <button
              className="vc-press"
              onClick={vc.exitToText}
              aria-label="Cancel voice recording"
              style={css(
                "flex:none;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center",
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className="vc-press"
              onClick={vc.exitToText}
              style={css(
                "flex:1;height:46px;text-align:left;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.1);color:rgba(255,255,255,.55);border-radius:23px;padding:0 18px;font-size:16px;cursor:text",
              )}
            >
              Type instead…
            </button>
            <button
              className="vc-press"
              onClick={vc.doneRecording}
              aria-label="Finish voice recording"
              style={css(
                "flex:none;width:46px;height:46px;border-radius:50%;border:none;background:#fff;color:#0b2a52;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 22px -8px rgba(0,0,0,.5)",
              )}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#0b2a52" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
        {isText && (
          <div
            style={css(
              "display:flex;align-items:flex-end;gap:10px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);border-radius:24px;padding:6px 6px 6px 8px",
            )}
          >
            <button
              className="vc-press"
              onClick={vc.startVoiceFromText}
              aria-label="Start voice recording"
              style={css(
                "flex:none;width:38px;height:38px;border-radius:50%;border:none;background:rgba(255,255,255,.16);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center",
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="#fff" />
                <path d="M6 11a6 6 0 0 0 12 0M12 17v4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <textarea
              ref={vc.setTaEl}
              onInput={(e) => {
                const el = e.currentTarget;
                vc.setTextDraft(el.value);
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 150) + "px";
              }}
              rows={1}
              placeholder="What's on your mind?"
              value={vc.textDraft}
              onChange={() => {}}
              style={css(
                "flex:1;min-height:32px;max-height:150px;border:none;background:none;color:#fff;font-size:17px;line-height:1.4;padding:7px 4px;outline:none;letter-spacing:-.2px;overflow-y:auto",
              )}
            />
            {canSend && (
              <button
                className="vc-press"
                onClick={vc.sendText}
                aria-label="Send"
                style={css(
                  "flex:none;width:40px;height:40px;border-radius:50%;border:none;background:#fff;color:#0b2a52;cursor:pointer;display:flex;align-items:center;justify-content:center",
                )}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* confirmation sheet */}
      {vc.confirm != null && <ConfirmSheet />}
      {vc.backgroundSheetOpen && <BackgroundSheet />}
    </div>
  );
}

function BackgroundSummary() {
  const vc = useVC();
  return (
    <div style={css("margin:0 2px 10px")}>
      {vc.selectedBackground.length > 0 && (
        <div className="vc-scroll" style={css("display:flex;gap:7px;overflow-x:auto;margin-bottom:9px")}>
          {vc.selectedBackground.map((item) => (
            <span key={item.id} style={css("flex:none;display:flex;align-items:center;gap:7px;max-width:220px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:6px 8px 6px 11px;font-size:12px;color:#fff")}>
              <span style={css("overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}><strong>{item.source}</strong> · {item.title}</span>
              <button aria-label={`Remove ${item.title}`} onClick={() => vc.removeBackground(item.id)} style={css("border:none;background:rgba(255,255,255,.14);color:#fff;width:20px;height:20px;border-radius:50%;cursor:pointer")}>×</button>
            </span>
          ))}
        </div>
      )}
      <button className="vc-press" onClick={vc.openBackgroundSheet} style={css("border:none;background:none;color:rgba(255,255,255,.82);font-size:14px;font-weight:600;padding:2px 4px;cursor:pointer")}>
        <span aria-hidden="true">＋</span> {vc.selectedBackground.length ? "Edit background" : "Add background"}
      </button>
    </div>
  );
}

function BackgroundSheet() {
  const vc = useVC();
  return (
    <div role="presentation" onClick={vc.closeBackgroundSheet} style={css("position:absolute;inset:0;z-index:12;background:rgba(0,0,0,.52);display:flex;align-items:flex-end")}>
      <section role="dialog" aria-modal="true" aria-labelledby="background-title" onClick={(event) => event.stopPropagation()} className="vc-sheet vc-scroll" style={css("width:100%;max-height:88%;overflow-y:auto;background:#f5f5f7;border-radius:26px 26px 0 0;padding:10px 18px 30px;color:#1d1d1f")}>
        <div style={css("width:40px;height:5px;border-radius:3px;background:rgba(0,0,0,.15);margin:0 auto 16px")} />
        <div style={css("display:flex;align-items:flex-start;gap:12px;margin:0 4px 8px")}>
          <div style={css("flex:1")}>
            <h2 id="background-title" style={css("font-size:22px;letter-spacing:-.4px;margin:0 0 5px")}>Add background</h2>
            <p style={css("font-size:14px;line-height:1.45;color:#6e6e73;margin:0")}>Choose only what is relevant. Background is optional, stays separate from your words, and is never shared automatically.</p>
          </div>
          <button aria-label="Close background" onClick={vc.closeBackgroundSheet} style={css("flex:none;border:none;width:34px;height:34px;border-radius:50%;background:#e5e5e7;color:#6e6e73;font-size:20px;cursor:pointer")}>×</button>
        </div>
        <div style={css("background:#eaf3ff;color:#174f86;border-radius:14px;padding:11px 13px;margin:14px 4px;font-size:13px;line-height:1.4")}>Demo sources only · No accounts are connected and nothing has been imported automatically.</div>
        <div style={css("display:flex;flex-direction:column;gap:9px;margin:0 4px")}>
          {demoBackgroundContext.map((item) => {
            const selected = vc.selectedBackground.some((selectedItem) => selectedItem.id === item.id);
            return <button key={item.id} aria-pressed={selected} onClick={() => vc.toggleBackground(item)} className="vc-press" style={{...css("width:100%;display:flex;gap:12px;text-align:left;border-radius:17px;padding:14px;background:#fff;cursor:pointer"),border:selected ? "2px solid #0066cc" : "2px solid transparent"}}>
              <span aria-hidden="true" style={{...css("flex:none;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700"),background:selected ? "#0066cc" : "#e9e9eb",color:selected ? "#fff" : "#8e8e93"}}>{selected ? "✓" : ""}</span>
              <span style={css("min-width:0")}>
                <span style={css("display:block;font-size:11px;text-transform:uppercase;letter-spacing:.35px;color:#0066cc;font-weight:700;margin-bottom:4px")}>{item.source}</span>
                <strong style={css("display:block;font-size:16px;margin-bottom:4px")}>{item.title}</strong>
                <span style={css("display:block;font-size:13px;line-height:1.4;color:#6e6e73")}>{item.detail}</span>
              </span>
            </button>;
          })}
        </div>
        <button className="vc-press" onClick={vc.closeBackgroundSheet} style={css("width:calc(100% - 8px);height:52px;border:none;border-radius:15px;background:#0066cc;color:#fff;font-size:17px;font-weight:600;cursor:pointer;margin:16px 4px 0")}>{vc.selectedBackground.length ? `Use ${vc.selectedBackground.length} selected` : "Continue without background"}</button>
      </section>
    </div>
  );
}

function ConfirmSheet() {
  const vc = useVC();
  const isType = vc.confirm === "type";
  return (
    <div
      style={css(
        "position:absolute;inset:0;z-index:9;background:rgba(0,0,0,.45);display:flex;align-items:flex-end",
      )}
    >
      <div
        className="vc-sheet"
        style={css(
          "width:100%;background:#fff;border-radius:26px 26px 0 0;padding:24px 22px 30px;color:#1d1d1f",
        )}
      >
        <div style={css("width:40px;height:5px;border-radius:3px;background:rgba(0,0,0,.15);margin:0 auto 18px")} />
        <div style={css("font-size:20px;font-weight:600;letter-spacing:-.3px;margin-bottom:8px")}>
          {isType ? "Type instead?" : "Cancel this recording?"}
        </div>
        <div style={css("font-size:15px;line-height:1.5;color:#6e6e73;margin-bottom:22px")}>
          {isType
            ? "Your current voice recording has not been saved."
            : "Your unsaved voice recording will be discarded."}
        </div>
        <button
          className="vc-press"
          onClick={vc.keepRecording}
          style={css(
            "width:100%;height:52px;border:none;border-radius:15px;background:#0066cc;color:#fff;font-size:17px;font-weight:600;cursor:pointer;margin-bottom:10px",
          )}
        >
          Keep recording
        </button>
        <button
          className="vc-press"
          onClick={vc.discardBack}
          style={css(
            "width:100%;height:52px;border:none;border-radius:15px;background:none;color:#ff3b30;font-size:17px;font-weight:600;cursor:pointer",
          )}
        >
          {isType ? "Discard and type" : "Discard and type instead"}
        </button>
      </div>
    </div>
  );
}

/* ---------- processing checklist ---------- */
function Processing({ kind }: { kind: CaptureKind }) {
  const vc = useVC();
  const labels =
    kind === "text"
      ? [
          "Reading what you shared…",
          "Identifying relevant topics…",
          "Adding helpful tags…",
          "Organising your thoughts…",
        ]
      : [
          "Saving your voice…",
          "Turning it into text…",
          "Identifying relevant topics…",
          "Organising your thoughts…",
        ];
  const procStep = vc.procStep;
  return (
    <div
      style={css(
        "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 40px;text-align:center;background:radial-gradient(circle at 50% 30%,#12395f,#081b31 84%);color:#fff",
      )}
    >
      <div style={css("position:relative;width:120px;height:120px;margin-bottom:38px")}>
        <span className="vc-ring" style={css("position:absolute;inset:0;border-radius:50%;border:2px solid #2997ff;animation:vcRingPulse 2s ease-out infinite")} />
        <span className="vc-ring" style={css("position:absolute;inset:0;border-radius:50%;border:2px solid #2997ff;animation:vcRingPulse 2s ease-out infinite 1s")} />
        <div style={css("position:absolute;inset:22px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#1f8bff,#0066cc);animation:vcPulse 1.8s ease-in-out infinite")} />
      </div>
      <div style={css("display:flex;flex-direction:column;gap:14px;width:100%;max-width:280px")}>
        {labels.map((label, i) => {
          const isDone = procStep > i;
          const dotBg = isDone
            ? "#0066cc"
            : procStep === i
              ? "#2997ff"
              : "rgba(255,255,255,.15)";
          return (
            <div
              key={label}
              style={{
                ...css("display:flex;align-items:center;gap:12px;transition:opacity .4s ease"),
                opacity: procStep >= i ? 1 : 0.35,
              }}
            >
              <span
                style={{
                  ...css(
                    "flex:none;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center",
                  ),
                  background: dotBg,
                }}
              >
                {isDone && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span
                style={{
                  ...css("font-size:17px;font-weight:500;letter-spacing:-.2px"),
                  color: procStep >= i ? "#fff" : "#6e6e73",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BackArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M15 5l-7 7 7 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
