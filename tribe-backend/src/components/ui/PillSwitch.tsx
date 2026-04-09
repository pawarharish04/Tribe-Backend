'use client';

interface PillSwitchProps {
    id?: string;
    checked: boolean;
    onChange: (val: boolean) => void;
    label?: string;
    description?: string;
}

export default function PillSwitch({ id, checked, onChange, label, description }: PillSwitchProps) {
    return (
        <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', width: '100%', cursor: 'pointer' }}>
            {(label || description) && (
                <div>
                    {label && (
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#f8fafc', fontFamily: 'Inter,sans-serif' }}>
                            {label}
                        </div>
                    )}
                    {description && (
                        <div style={{ fontSize: '12px', color: 'rgba(248,250,252,0.45)', fontFamily: 'Inter,sans-serif', marginTop: '3px', lineHeight: 1.5 }}>
                            {description}
                        </div>
                    )}
                </div>
            )}

            {/* Switch track */}
            <div
                onClick={() => onChange(!checked)}
                style={{
                    position: 'relative',
                    width: '52px', height: '28px',
                    borderRadius: '999px',
                    background: checked ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'rgba(255,255,255,0.10)',
                    border: `1px solid ${checked ? 'transparent' : 'rgba(255,255,255,0.16)'}`,
                    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: checked ? '0 0 16px rgba(139,92,246,0.35)' : 'none',
                    flexShrink: 0,
                    cursor: 'pointer',
                }}
            >
                {/* Thumb */}
                <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: checked ? '25px' : '3px',
                    width: '20px', height: '20px',
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    transition: 'left 0.25s cubic-bezier(0.16,1,0.3,1)',
                }} />
            </div>
        </label>
    );
}
