import { RotateCw } from 'lucide-react';

export function PortraitWarning() {
  return (
    <div className="portrait-warning fixed inset-0 bg-[var(--color-fircik-green-dark)] flex flex-col items-center justify-center p-8 z-50">
      <RotateCw className="w-24 h-24 text-[var(--color-fircik-gold)] animate-spin mb-6" />
      <h2 className="text-center mb-4">Rotirajte uređaj</h2>
      <p className="text-center text-[var(--color-fircik-beige)] max-w-md">
        Ova igra je optimizovana za horizontalnu orijentaciju. Molimo vas da rotirate svoj uređaj u pejzažni režim.
      </p>
    </div>
  );
}
