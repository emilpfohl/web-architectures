const React = require('react');
const { Html, Head, Body, Container, Section, Hr, Text } = require('@react-email/components');

const e = React.createElement;

const COLORS = {
  primary: '#50644e',
  onPrimary: '#ffffff',
  surface: '#ffffff',
  background: '#f6f5f2',
  onSurface: '#1c1c1a',
  onSurfaceVariant: '#6b6f68',
  outline: '#e5e3dd'
};

const FONT_HEADLINE = "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif";
const FONT_BODY = "'Be Vietnam Pro', 'Helvetica Neue', Arial, sans-serif";

function HouseIcon() {
  return e('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' },
    e('path', {
      d: 'M12 3.2 2.5 11h2.6v9h5.4v-6.2h3v6.2h5.4v-9h2.6L12 3.2z',
      fill: COLORS.onPrimary
    })
  );
}

function EmailLogo({ wgName }) {
  return e(Section, { style: { marginBottom: '24px' } },
    e('table', { role: 'presentation', cellPadding: 0, cellSpacing: 0, border: 0 },
      e('tbody', null,
        e('tr', null,
          e('td', { style: { verticalAlign: 'middle', paddingRight: '10px' } },
            e('table', {
              role: 'presentation', cellPadding: 0, cellSpacing: 0, border: 0,
              style: {
                width: '32px',
                height: '32px',
                backgroundColor: COLORS.primary,
                borderRadius: '9999px'
              }
            },
              e('tbody', null,
                e('tr', null,
                  e('td', { align: 'center', valign: 'middle', style: { width: '32px', height: '32px' } }, e(HouseIcon))
                )
              )
            )
          ),
          e('td', { style: { verticalAlign: 'middle' } },
            e(Text, {
              style: {
                margin: 0,
                fontFamily: FONT_HEADLINE,
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: COLORS.onSurface
              }
            }, wgName || 'WG')
          )
        )
      )
    )
  );
}

function EmailFooter({ wgName }) {
  return e(React.Fragment, null,
    e(Hr, { style: { borderColor: COLORS.outline, margin: '28px 0 16px' } }),
    e(Text, {
      style: {
        margin: 0,
        fontFamily: FONT_BODY,
        fontSize: '12px',
        color: COLORS.onSurfaceVariant
      }
    }, `Diese Nachricht wurde automatisch von ${wgName || 'deiner WG'} verschickt.`)
  );
}

function EmailLayout({ wgName, children }) {
  return e(Html, null,
    e(Head, null),
    e(Body, { style: { fontFamily: FONT_BODY, backgroundColor: COLORS.background, padding: '32px 0', margin: 0 } },
      e(Container, {
        style: {
          backgroundColor: COLORS.surface,
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '480px',
          border: `1px solid ${COLORS.outline}`
        }
      },
        e(EmailLogo, { wgName }),
        e(Section, null, children),
        e(EmailFooter, { wgName })
      )
    )
  );
}

module.exports = { EmailLayout, e, COLORS, FONT_HEADLINE, FONT_BODY };
