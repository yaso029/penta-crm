import { NAVY, GOLD, BackBtn, NextBtn, StepTitle, FieldLabel, TextInput, SelectInput, YesNoToggle } from './ui';
import { T } from './translations';

const NATIONALITIES = [
  // Gulf & Arab
  { value: 'AE', label: '🇦🇪 United Arab Emirates' },
  { value: 'SA', label: '🇸🇦 Saudi Arabia' },
  { value: 'KW', label: '🇰🇼 Kuwait' },
  { value: 'QA', label: '🇶🇦 Qatar' },
  { value: 'BH', label: '🇧🇭 Bahrain' },
  { value: 'OM', label: '🇴🇲 Oman' },
  { value: 'EG', label: '🇪🇬 Egypt' },
  { value: 'LB', label: '🇱🇧 Lebanon' },
  { value: 'JO', label: '🇯🇴 Jordan' },
  { value: 'SY', label: '🇸🇾 Syria' },
  { value: 'IQ', label: '🇮🇶 Iraq' },
  { value: 'PS', label: '🇵🇸 Palestine' },
  { value: 'YE', label: '🇾🇪 Yemen' },
  { value: 'LY', label: '🇱🇾 Libya' },
  { value: 'TN', label: '🇹🇳 Tunisia' },
  { value: 'MA', label: '🇲🇦 Morocco' },
  { value: 'DZ', label: '🇩🇿 Algeria' },
  { value: 'SD', label: '🇸🇩 Sudan' },
  // South Asia
  { value: 'IN', label: '🇮🇳 India' },
  { value: 'PK', label: '🇵🇰 Pakistan' },
  { value: 'BD', label: '🇧🇩 Bangladesh' },
  { value: 'LK', label: '🇱🇰 Sri Lanka' },
  { value: 'NP', label: '🇳🇵 Nepal' },
  // Southeast Asia
  { value: 'PH', label: '🇵🇭 Philippines' },
  { value: 'ID', label: '🇮🇩 Indonesia' },
  { value: 'TH', label: '🇹🇭 Thailand' },
  { value: 'VN', label: '🇻🇳 Vietnam' },
  { value: 'MY', label: '🇲🇾 Malaysia' },
  { value: 'SG', label: '🇸🇬 Singapore' },
  { value: 'MM', label: '🇲🇲 Myanmar' },
  // East Asia
  { value: 'CN', label: '🇨🇳 China' },
  { value: 'JP', label: '🇯🇵 Japan' },
  { value: 'KR', label: '🇰🇷 South Korea' },
  // Central Asia
  { value: 'KZ', label: '🇰🇿 Kazakhstan' },
  { value: 'UZ', label: '🇺🇿 Uzbekistan' },
  { value: 'TM', label: '🇹🇲 Turkmenistan' },
  // Caucasus
  { value: 'TR', label: '🇹🇷 Turkey' },
  { value: 'IR', label: '🇮🇷 Iran' },
  { value: 'AZ', label: '🇦🇿 Azerbaijan' },
  { value: 'GE', label: '🇬🇪 Georgia' },
  { value: 'AM', label: '🇦🇲 Armenia' },
  // Europe - West
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'IT', label: '🇮🇹 Italy' },
  { value: 'ES', label: '🇪🇸 Spain' },
  { value: 'NL', label: '🇳🇱 Netherlands' },
  { value: 'BE', label: '🇧🇪 Belgium' },
  { value: 'PT', label: '🇵🇹 Portugal' },
  { value: 'CH', label: '🇨🇭 Switzerland' },
  { value: 'AT', label: '🇦🇹 Austria' },
  { value: 'GR', label: '🇬🇷 Greece' },
  { value: 'IE', label: '🇮🇪 Ireland' },
  { value: 'SE', label: '🇸🇪 Sweden' },
  { value: 'NO', label: '🇳🇴 Norway' },
  { value: 'DK', label: '🇩🇰 Denmark' },
  { value: 'FI', label: '🇫🇮 Finland' },
  { value: 'LU', label: '🇱🇺 Luxembourg' },
  { value: 'IS', label: '🇮🇸 Iceland' },
  // Europe - East
  { value: 'RU', label: '🇷🇺 Russia' },
  { value: 'UA', label: '🇺🇦 Ukraine' },
  { value: 'PL', label: '🇵🇱 Poland' },
  { value: 'RO', label: '🇷🇴 Romania' },
  { value: 'CZ', label: '🇨🇿 Czech Republic' },
  { value: 'HU', label: '🇭🇺 Hungary' },
  { value: 'SK', label: '🇸🇰 Slovakia' },
  { value: 'BG', label: '🇧🇬 Bulgaria' },
  { value: 'RS', label: '🇷🇸 Serbia' },
  { value: 'HR', label: '🇭🇷 Croatia' },
  { value: 'BA', label: '🇧🇦 Bosnia & Herzegovina' },
  { value: 'AL', label: '🇦🇱 Albania' },
  { value: 'MK', label: '🇲🇰 North Macedonia' },
  { value: 'SI', label: '🇸🇮 Slovenia' },
  { value: 'EE', label: '🇪🇪 Estonia' },
  { value: 'LV', label: '🇱🇻 Latvia' },
  { value: 'LT', label: '🇱🇹 Lithuania' },
  { value: 'BY', label: '🇧🇾 Belarus' },
  { value: 'MD', label: '🇲🇩 Moldova' },
  // Israel
  { value: 'IL', label: '🇮🇱 Israel' },
  // Americas
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'BR', label: '🇧🇷 Brazil' },
  { value: 'AR', label: '🇦🇷 Argentina' },
  { value: 'CO', label: '🇨🇴 Colombia' },
  { value: 'MX', label: '🇲🇽 Mexico' },
  { value: 'VE', label: '🇻🇪 Venezuela' },
  { value: 'CL', label: '🇨🇱 Chile' },
  { value: 'PE', label: '🇵🇪 Peru' },
  { value: 'EC', label: '🇪🇨 Ecuador' },
  { value: 'UY', label: '🇺🇾 Uruguay' },
  { value: 'BO', label: '🇧🇴 Bolivia' },
  // Africa
  { value: 'NG', label: '🇳🇬 Nigeria' },
  { value: 'GH', label: '🇬🇭 Ghana' },
  { value: 'KE', label: '🇰🇪 Kenya' },
  { value: 'ET', label: '🇪🇹 Ethiopia' },
  { value: 'ZA', label: '🇿🇦 South Africa' },
  { value: 'TZ', label: '🇹🇿 Tanzania' },
  { value: 'UG', label: '🇺🇬 Uganda' },
  { value: 'CM', label: '🇨🇲 Cameroon' },
  { value: 'SN', label: '🇸🇳 Senegal' },
  { value: 'CI', label: '🇨🇮 Ivory Coast' },
  { value: 'ZW', label: '🇿🇼 Zimbabwe' },
  { value: 'ZM', label: '🇿🇲 Zambia' },
  { value: 'SO', label: '🇸🇴 Somalia' },
  { value: 'ER', label: '🇪🇷 Eritrea' },
  // Oceania
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'NZ', label: '🇳🇿 New Zealand' },
  // Other
  { value: 'OTHER', label: '🌍 Other' },
];

export default function ContactStep({ data, update, onNext, onBack, language = 'en' }) {
  const lang = T[language] || T.en;
  const p = lang.contact;
  const canProceed = data.fullName.trim() && data.whatsapp.trim();

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <BackBtn onClick={onBack} label={lang.back} />
      <StepTitle title={p.title} subtitle={p.subtitle} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <FieldLabel required>{p.nameLabel}</FieldLabel>
          <TextInput value={data.fullName} onChange={v => update({ fullName: v })} placeholder={p.namePlaceholder} />
        </div>

        <div>
          <FieldLabel required>{p.whatsappLabel}</FieldLabel>
          <TextInput value={data.whatsapp} onChange={v => update({ whatsapp: v })} placeholder="50 123 4567" type="tel" prefix="+971" />
        </div>

        <div>
          <FieldLabel>{p.emailLabel}</FieldLabel>
          <TextInput value={data.email} onChange={v => update({ email: v })} placeholder="your@email.com" type="email" />
        </div>

        <div>
          <FieldLabel>{p.nationalityLabel}</FieldLabel>
          <SelectInput value={data.nationality} onChange={v => update({ nationality: v })} options={NATIONALITIES} placeholder={p.nationalityPlaceholder} />
        </div>

        <div>
          <FieldLabel>{p.inDubaiLabel}</FieldLabel>
          <YesNoToggle value={data.inDubai} onChange={v => update({ inDubai: v })} yesLabel={lang.yes} noLabel={lang.no} />
        </div>
      </div>

      <NextBtn onClick={onNext} disabled={!canProceed} label={lang.next} />
    </div>
  );
}
