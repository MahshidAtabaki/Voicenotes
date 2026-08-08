import { useState } from "react";
import { useVC } from "@/lib/store";
import type { ReviewItem } from "@/lib/types";
import { css } from "../css";
import { fmtDur } from "./shared";

export function Review() {
  const vc = useVC();
  const items = vc.items;
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedIndex = Math.min(activeIndex, Math.max(0, items.length - 1));
  const activeItem = items[selectedIndex];
  const isVoice = vc.captureKind !== "text";
  const sourceLabel = vc.captureKind === "text" ? "What you wrote" : "Your words";
  const multi = items.length > 1;
  const headline = multi
    ? vc.captureKind === "text"
      ? "A few separate things."
      : "I heard a few separate things."
    : vc.captureKind === "text"
      ? "Here's what you shared."
      : "Here's what I captured.";
  const sub = multi
    ? `I organised them into ${items.length} thoughts. Everything below is yours to edit.`
    : "Your words, with a little organisation around them.";
  const itemCountLabel = multi ? `${items.length} thoughts` : "thought";

  return (
    <div
      className="vc-screen vc-scroll"
      style={css(
        "position:absolute;inset:0;background:#f5f5f7;overflow-y:auto;padding:64px 0 96px",
      )}
    >
      <div style={css("padding:12px 22px 6px;display:flex;align-items:center;gap:12px")}>
        <button
          className="vc-press"
          onClick={vc.cancelReview}
          style={css(
            "width:38px;height:38px;border:none;border-radius:50%;background:#fff;color:#1d1d1f;font-size:17px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.08)",
          )}
        >
          ✕
        </button>
        {isVoice && !vc.isSamplePreview && (
          <>
            <button
              className="vc-press"
              onClick={vc.playAudio}
              style={css(
                "margin-left:auto;display:flex;align-items:center;gap:8px;border:1px solid rgba(0,0,0,.1);background:#fff;border-radius:20px;padding:8px 15px;font-size:14px;font-weight:500;color:#1d1d1f;cursor:pointer",
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#0066cc">
                <path d="M8 5v14l11-7z" />
              </svg>
              {fmtDur(vc.elapsed) || "0:00"}
            </button>
            <button
              className="vc-press"
              onClick={vc.openTranscript}
              style={css(
                "border:1px solid rgba(0,0,0,.1);background:#fff;border-radius:20px;padding:8px 15px;font-size:14px;font-weight:500;color:#1d1d1f;cursor:pointer",
              )}
            >
              Transcript
            </button>
          </>
        )}
      </div>

      <div style={css("padding:14px 24px 8px")}>
        {vc.isSamplePreview && (
          <div role="status" style={css("background:#fff3cd;color:#664d03;border-radius:14px;padding:12px 14px;margin-bottom:14px;font-size:14px;line-height:1.4")}>
            <strong>Sample preview</strong> · These are example words only. They cannot be saved or shared as your recording.
          </div>
        )}
        <h1 style={css("font-size:26px;font-weight:600;letter-spacing:-.5px;color:#1d1d1f;margin:0 0 6px")}>
          {headline}
        </h1>
        <p style={css("font-size:16px;line-height:1.5;color:#6e6e73;margin:0;letter-spacing:-.2px")}>
          {sub}
        </p>
      </div>

      <div style={css("padding:12px 16px 0")}>
        {vc.selectedBackground.length > 0 && (
          <section aria-labelledby="selected-background-title" style={css("background:#eef4fd;border-radius:18px;padding:14px 16px;margin:0 4px 12px")}>
            <div id="selected-background-title" style={css("font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:#0066cc;margin-bottom:4px")}>Selected background</div>
            <p style={css("font-size:12px;color:#6e6e73;margin:0 0 10px")}>Context you chose — separate from what you said or wrote.</p>
            {vc.selectedBackground.map((item) => <div key={item.id} style={css("display:flex;align-items:center;gap:9px;background:#fff;border-radius:12px;padding:10px 11px;margin-top:7px")}>
              <div style={css("flex:1;min-width:0")}><strong style={css("display:block;font-size:13px")}>{item.title}</strong><span style={css("font-size:11px;color:#0066cc")}>{item.source}</span></div>
              <button aria-label={`Remove ${item.title}`} onClick={() => vc.removeBackground(item.id)} style={css("border:none;background:none;color:#6e6e73;font-size:13px;cursor:pointer")}>Remove</button>
            </div>)}
          </section>
        )}
        {items.length > 1 && (
          <div
            role="tablist"
            aria-label="Captured thoughts"
            style={css(
              "display:flex;gap:4px;overflow-x:auto;background:#e9e9eb;border-radius:14px;padding:4px;margin:0 4px 12px;scrollbar-width:none",
            )}
          >
            {items.map((item, index) => {
              const active = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={active}
                  className="vc-press"
                  onClick={() => setActiveIndex(index)}
                  style={{
                    ...css(
                      "flex:1;min-width:92px;border:none;border-radius:11px;padding:9px 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px;font-weight:600;cursor:pointer;transition:transform .32s cubic-bezier(.2,.8,.2,1),background .32s cubic-bezier(.2,.8,.2,1),color .2s ease,box-shadow .32s ease",
                    ),
                    background: active ? "#fff" : "transparent",
                    color: active ? "#0066cc" : "#6e6e73",
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,.12)" : "none",
                    transform: active ? "scale(1)" : "scale(.98)",
                  }}
                >
                  {index + 1}. {item.title}
                </button>
              );
            })}
          </div>
        )}
        {activeItem && (
          <ReviewCard
            key={activeItem.id}
            it={activeItem}
            sourceLabel={sourceLabel}
            delay="0s"
          />
        )}
      </div>

      <div style={css("padding:8px 24px 0")}>
        {vc.isSamplePreview ? (
          <button className="vc-press" onClick={vc.cancelReview} style={css("width:100%;height:54px;border:none;border-radius:16px;background:#0066cc;color:#fff;font-size:18px;font-weight:600;cursor:pointer")}>
            Close sample preview
          </button>
        ) : <>
        <div
          style={css(
            "display:flex;align-items:center;justify-content:space-between;background:#fff;border-radius:16px;padding:14px 16px;margin-bottom:16px",
          )}
        >
          <div>
            <div style={css("font-size:15px;font-weight:600;color:#1d1d1f;letter-spacing:-.2px")}>
              Keep private
            </div>
            <div style={css("font-size:13px;color:#8e8e93;margin-top:2px")}>
              Only you can see this. Share later if you choose.
            </div>
          </div>
          <button
            className="vc-press"
            onClick={vc.toggleReviewShare}
            style={{
              ...css(
                "flex:none;width:52px;height:32px;border-radius:20px;border:none;position:relative;cursor:pointer;transition:background .25s",
              ),
              background: vc.reviewShare ? "#34c759" : "rgba(120,120,128,.32)",
            }}
          >
            <span
              style={{
                ...css(
                  "position:absolute;top:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .25s cubic-bezier(.2,.8,.2,1)",
                ),
                left: vc.reviewShare ? "23px" : "3px",
              }}
            />
          </button>
        </div>
        <button
          className="vc-press"
          onClick={vc.saveAll}
          disabled={items.length === 0}
          style={css(
            "width:100%;height:54px;border:none;border-radius:16px;background:#0066cc;color:#fff;font-size:18px;font-weight:600;letter-spacing:-.2px;cursor:pointer",
          )}
        >
          Save {itemCountLabel}
        </button>
        </>}
      </div>
    </div>
  );
}

function ReviewCard({
  it,
  sourceLabel,
  delay,
}: {
  it: ReviewItem;
  sourceLabel: string;
  delay: string;
}) {
  const vc = useVC();
  return (
    <div
      className="vc-stag"
      style={{
        ...css(
          "background:#fff;border-radius:22px;padding:6px 6px 18px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.05)",
        ),
        animationDelay: delay,
      }}
    >
      <div style={css("display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px")}>
        <span style={css("font-size:12px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:#0066cc;background:#eef4fd;padding:4px 10px;border-radius:20px")}>
          {it.type}
        </span>
        <button
          className="vc-press"
          onClick={() => vc.removeItem(it.id)}
          style={css("border:none;background:none;color:#8e8e93;font-size:13px;cursor:pointer")}
        >
          Remove
        </button>
      </div>

      {/* YOUR WORDS — kept exactly */}
      <div style={css("margin:0 10px;background:#f5f5f7;border-radius:16px;padding:14px 16px")}>
        <div style={css("display:flex;align-items:center;gap:7px;margin-bottom:8px")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3" fill="#1d1d1f" />
            <path d="M6 11a6 6 0 0 0 12 0M12 17v4" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={css("font-size:12px;font-weight:600;letter-spacing:.2px;text-transform:uppercase;color:#1d1d1f")}>
            {sourceLabel}
          </span>
        </div>
        <p style={css("font-size:16px;line-height:1.55;color:#1d1d1f;margin:0;letter-spacing:-.2px")}>
          &ldquo;{it.sourceText}&rdquo;
        </p>
      </div>

      {/* ORGANISED FOR YOU — editable */}
      <div style={css("margin:14px 10px 0;border:1px dashed rgba(0,102,204,.3);border-radius:16px;padding:14px 16px")}>
        <div style={css("display:flex;align-items:center;gap:7px;margin-bottom:12px")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#0066cc" />
          </svg>
          <span style={css("font-size:12px;font-weight:600;letter-spacing:.2px;text-transform:uppercase;color:#0066cc")}>
            Organised for you · you can edit
          </span>
        </div>
        <input
          value={it.title}
          onChange={(e) => vc.editField(it.id, "title", e.currentTarget.value)}
          style={css(
            "width:100%;border:none;background:none;font-size:19px;font-weight:600;letter-spacing:-.3px;color:#1d1d1f;padding:0;margin-bottom:6px;outline:none",
          )}
        />
        <textarea
          value={it.summary}
          onChange={(e) => vc.editField(it.id, "summary", e.currentTarget.value)}
          rows={2}
          style={css(
            "width:100%;border:none;background:none;font-size:15px;line-height:1.5;color:#6e6e73;padding:0;outline:none",
          )}
        />
        <div style={css("font-size:11px;font-weight:600;letter-spacing:.2px;text-transform:uppercase;color:#8e8e93;margin:16px 0 8px")}>
          Tags
        </div>
        <div style={css("display:flex;flex-wrap:wrap;gap:8px")}>
          {it.emotions.map((emotion) => (
            <SelectedTag
              key={`emotion-${emotion.label}`}
              label={emotion.label}
              onRemove={() => vc.toggleEmotion(it.id, emotion.label)}
            />
          ))}
          {it.topics.map((t) => (
            <SelectedTag
              key={`topic-${t}`}
              label={t}
              onRemove={() => vc.removeTopic(it.id, t)}
            />
          ))}
          <button
            onClick={() => {
              const tag = window.prompt("Add a topic");
              if (tag) vc.addTopic(it.id, tag);
            }}
            style={css(
              "border:1px dashed rgba(0,0,0,.18);color:#8e8e93;border-radius:20px;padding:7px 12px;font-size:14px;background:none;cursor:pointer",
            )}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectedTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span
      style={css(
        "display:flex;align-items:center;gap:7px;border:1px solid #0066cc;background:#0066cc;color:#fff;border-radius:20px;padding:7px 11px 7px 13px;font-size:14px;font-weight:500",
      )}
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        style={css(
          "border:none;background:none;color:#fff;cursor:pointer;font-size:16px;line-height:1;padding:0;opacity:.8",
        )}
      >
        ×
      </button>
    </span>
  );
}
