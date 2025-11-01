"use client";

interface LegalFooterProps {
  onDisclaimerOpen: () => void;
  onDMCAOpen: () => void;
}

export const LegalFooter = ({ onDisclaimerOpen, onDMCAOpen }: LegalFooterProps) => {
  return (
    <>
      {/* Legal Notice Footer */}
      <div className="w-full bg-background/90 backdrop-blur-sm border-t border-border p-4">
        <div className="max-w-4xl mx-auto text-center text-xs text-muted-foreground">
          <p className="mb-2">
            By using this service, you agree to our Terms of Service and acknowledge our disclaimers.
            User uploaded content is not monitored or endorsed by us.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={onDisclaimerOpen}
              style={{
                background: 'none',
                border: 'none',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0',
                height: 'auto',
                color: 'hsl(var(--muted-foreground))'
              }}
            >
              Legal Terms & Disclaimers
            </button>
            <button
              onClick={onDMCAOpen}
              style={{
                background: 'none',
                border: 'none',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0',
                height: 'auto',
                color: 'hsl(var(--muted-foreground))'
              }}
            >
              DMCA Notice & Copyright Policy
            </button>
          </div>
        </div>
      </div>
    </>
  );
};