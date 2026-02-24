import { ExtensiveEditor, type ExtensiveEditorProps } from "../extensive";

export type EmailComposeEditorProps = Omit<ExtensiveEditorProps, "featureFlags"> & {
  showTo?: boolean;
  showCc?: boolean;
  showBcc?: boolean;
  showSubject?: boolean;
};

export function EmailComposeEditor({
  className,
  variantClassName,
  showTo = true,
  showCc = false,
  showBcc = false,
  showSubject = true,
  ...props
}: EmailComposeEditorProps) {
  return (
    <div className={["luthor-preset-email-compose", className].filter(Boolean).join(" ")}>
      <div className="luthor-email-compose-shell">
        {showTo && <label className="luthor-email-compose-row" data-testid="email-row-to"><span>To</span><input type="text" readOnly value="" /></label>}
        {showCc && <label className="luthor-email-compose-row" data-testid="email-row-cc"><span>Cc</span><input type="text" readOnly value="" /></label>}
        {showBcc && <label className="luthor-email-compose-row" data-testid="email-row-bcc"><span>Bcc</span><input type="text" readOnly value="" /></label>}
        {showSubject && <label className="luthor-email-compose-row" data-testid="email-row-subject"><span>Subject</span><input type="text" readOnly value="" /></label>}
      </div>
      <ExtensiveEditor
        {...props}
        variantClassName={["luthor-preset-email-compose__variant", variantClassName]
          .filter(Boolean)
          .join(" ")}
        featureFlags={{
          bold: true,
          italic: true,
          underline: true,
          strikethrough: false,
          link: true,
          list: true,
          history: true,
          blockFormat: true,
          table: false,
          image: false,
          iframeEmbed: false,
          youTubeEmbed: false,
          emoji: true,
          customNode: false,
        }}
      />
    </div>
  );
}
